package com.rental.contract.controller;

import com.rental.contract.client.RoomClient;
import com.rental.contract.client.TenantClient;
import com.rental.contract.dto.ApiResponse;
import com.rental.contract.entity.*;
import com.rental.contract.publisher.ContractEventPublisher;
import com.rental.contract.repository.*;
import com.rental.contract.service.impl.ContractServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CheckoutWorkflowTest {
    final ContractRepository contracts = mock(ContractRepository.class);
    final MoveOutSettlementRepository settlements = mock(MoveOutSettlementRepository.class);
    final RoomRequestRepository requests = mock(RoomRequestRepository.class);
    final RoomRequestVoteRepository votes = mock(RoomRequestVoteRepository.class);
    final TenantClient tenants = mock(TenantClient.class);
    final RoomClient rooms = mock(RoomClient.class);
    final ContractEventPublisher events = mock(ContractEventPublisher.class);
    final ContractServiceImpl service = new ContractServiceImpl(contracts, tenants, rooms, events);
    final com.rental.contract.service.ReservationService reservations = mock(com.rental.contract.service.ReservationService.class);
    final ContractWorkflowController controller = new ContractWorkflowController(contracts, settlements, requests, votes, service, rooms, tenants, reservations, new LocalTransactionManager());
    Contract contract;
    RoomRequest request;

    @BeforeEach
    void setup() {
        contract = Contract.builder().id(10L).roomId(101L).tenantId(1L).status(ContractStatus.ACTIVE)
                .endDate(LocalDate.now().minusDays(1)).depositAmount(new BigDecimal("3500000")).build();
        request = RoomRequest.builder().id(20L).type("CHECKOUT").contractId(10L).targetRoomId(101L)
                .tenantId(1L).moveOutDate(LocalDate.now()).bankAccount("123456789").bankName("Bank")
                .accountHolder("Tenant").build();
        when(contracts.findForLeave(10L)).thenReturn(Optional.of(contract));
        when(contracts.findById(10L)).thenReturn(Optional.of(contract));
        when(contracts.save(any())).thenAnswer(call -> call.getArgument(0));
        when(requests.findForReservation(20L)).thenReturn(Optional.of(request));
        when(requests.findById(20L)).thenReturn(Optional.of(request));
        when(settlements.findByContractId(10L)).thenReturn(Optional.empty());
        when(settlements.save(any())).thenAnswer(call -> call.getArgument(0));
        when(tenants.getMembers()).thenReturn(ApiResponse.success(List.of(
                new TenantClient.Member(30L, 101L, 1L, 10L, "REPRESENTATIVE", "ACTIVE"),
                new TenantClient.Member(31L, 101L, 2L, 10L, "MEMBER", "ACTIVE"),
                new TenantClient.Member(32L, 102L, 3L, 11L, "MEMBER", "ACTIVE"))));
    }

    MoveOutSettlement approve() {
        controller.approve(20L, "ROLE_STAFF");
        var saved = ArgumentCaptor.forClass(MoveOutSettlement.class);
        verify(settlements).save(saved.capture());
        return saved.getValue();
    }

    @Test
    void approvalCreatesSettlementUsingTheCorrectRoomContractAndRefundAccount() {
        var settlement = approve();
        assertEquals("APPROVED", request.getStatus());
        assertEquals(10L, settlement.getContractId());
        assertEquals(101L, settlement.getRoomId());
        assertEquals("123456789", settlement.getBankAccount());
        assertEquals(new BigDecimal("3500000"), settlement.getOriginalDeposit());
        assertFalse(settlement.isForfeitDeposit());
        assertEquals(ContractStatus.ACTIVE, contract.getStatus());
        verifyNoInteractions(rooms, events);
    }

    @Test
    void completionEndsContractReleasesRoomAndMovesAllItsMembersOut() {
        var settlement = approve();
        when(settlements.findById(40L)).thenReturn(Optional.of(settlement));
        controller.settle(40L, Map.of("damageFee", new BigDecimal("100000"), "unpaidUtilitiesFee", new BigDecimal("200000")), "ROLE_STAFF");
        assertEquals(ContractStatus.TERMINATED, contract.getStatus());
        assertEquals(new BigDecimal("3200000"), settlement.getRefundAmount());
        assertEquals("COMPLETED", settlement.getRefundStatus());
        verify(rooms).updateRoomStatus(eq(101L), argThat(dto -> "AVAILABLE".equals(dto.getStatus())));
        verify(tenants).updateMember(30L, Map.of("status", "MOVED_OUT"), "ROLE_STAFF");
        verify(tenants).updateMember(31L, Map.of("status", "MOVED_OUT"), "ROLE_STAFF");
        verify(tenants, never()).updateMember(eq(32L), anyMap(), anyString());
    }

    @Test
    void earlyCheckoutDoesNotRefundTheForfeitedDeposit() {
        contract.setEndDate(LocalDate.now().plusMonths(2));
        var settlement = approve();
        assertTrue(settlement.isForfeitDeposit());
        when(settlements.findById(40L)).thenReturn(Optional.of(settlement));
        controller.settle(40L, Map.of(), "ROLE_STAFF");
        assertEquals(BigDecimal.ZERO, settlement.getRefundAmount());
    }

    @Test
    void oldApprovedCheckoutCanRecoverItsMissingSettlement() {
        request.setStatus("APPROVED");
        assertNotNull(approve());
    }

    @Test
    void repeatedApprovalDoesNotCreateAnotherSettlement() {
        when(settlements.findByContractId(10L)).thenReturn(Optional.of(MoveOutSettlement.builder().contractId(10L).build()));
        controller.approve(20L, "ROLE_STAFF");
        verify(settlements, never()).save(any());
    }

    @Test
    void wrongRoomCannotBeApproved() {
        request.setTargetRoomId(102L);
        assertThrows(ResponseStatusException.class, () -> controller.approve(20L, "ROLE_STAFF"));
        verify(settlements, never()).save(any());
    }

    @Test
    void tenantCannotApproveOrCompleteCheckout() {
        assertThrows(ResponseStatusException.class, () -> controller.approve(20L, "ROLE_TENANT"));
        assertThrows(ResponseStatusException.class, () -> controller.settle(40L, Map.of(), "ROLE_TENANT"));
        verifyNoInteractions(contracts, settlements, requests, rooms);
    }

    @Test
    void repeatingCompletedSettlementDoesNotTerminateContractAgain() {
        var settlement = MoveOutSettlement.builder().refundStatus("COMPLETED").build();
        when(settlements.findById(40L)).thenReturn(Optional.of(settlement));
        controller.settle(40L, Map.of(), "ROLE_STAFF");
        verifyNoInteractions(contracts, tenants, rooms, events);
    }
}
