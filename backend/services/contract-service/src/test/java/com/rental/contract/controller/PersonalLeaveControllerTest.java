package com.rental.contract.controller;

import com.rental.contract.client.BillingClient;
import com.rental.contract.client.TenantClient;
import com.rental.contract.client.dto.TenantDto;
import com.rental.contract.dto.ApiResponse;
import com.rental.contract.entity.Contract;
import com.rental.contract.entity.ContractStatus;
import com.rental.contract.repository.ContractRepository;
import com.rental.contract.service.ContractService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PersonalLeaveControllerTest {
    private final ContractRepository repository = mock(ContractRepository.class);
    private final ContractService contracts = mock(ContractService.class);
    private final TenantClient tenants = mock(TenantClient.class);
    private final BillingClient billing = mock(BillingClient.class);
    private final PersonalLeaveController controller = new PersonalLeaveController(repository, contracts, tenants, billing);
    private Contract contract;

    @BeforeEach
    void setup() {
        contract = Contract.builder().id(10L).roomId(20L).tenantId(1L).status(ContractStatus.ACTIVE).build();
        when(repository.findForLeave(10L)).thenReturn(Optional.of(contract));
        when(tenants.getTenantById(1L)).thenReturn(ApiResponse.success(TenantDto.builder().id(1L).email("owner@test.vn").build()));
        when(tenants.getTenantById(2L)).thenReturn(ApiResponse.success(TenantDto.builder().id(2L).email("member@test.vn").build()));
        when(tenants.getMembers()).thenReturn(ApiResponse.success(List.of(
                new TenantClient.Member(101L, 20L, 1L, 10L, "REPRESENTATIVE", "ACTIVE"),
                new TenantClient.Member(102L, 20L, 2L, 10L, "MEMBER", "ACTIVE"))));
        when(billing.getInvoices(anyLong())).thenReturn(List.of());
    }

    @Test
    void memberLeavesWithoutTerminatingSharedContract() {
        controller.leave(10L, new PersonalLeaveController.LeaveRequest(2L, null, "Moving"), "member@test.vn", "ROLE_TENANT");
        verify(tenants).updateMember(102L, Map.of("status", "MOVED_OUT", "roleInRoom", "MEMBER"), "ROLE_STAFF");
        verifyNoInteractions(contracts);
        verify(repository, never()).save(any());
        assertEquals(1L, contract.getTenantId());
    }

    @Test
    void holderTransfersAndLeavesInOneOperation() {
        controller.leave(10L, new PersonalLeaveController.LeaveRequest(1L, 2L, "Moving"), "owner@test.vn", "ROLE_TENANT");
        assertEquals(2L, contract.getTenantId());
        verify(repository).save(contract);
        verify(tenants).updateMember(102L, Map.of("roleInRoom", "REPRESENTATIVE"), "ROLE_STAFF");
        verify(tenants).updateMember(101L, Map.of("status", "MOVED_OUT", "roleInRoom", "MEMBER"), "ROLE_STAFF");
        verifyNoInteractions(contracts);
    }

    @Test
    void holderMustChooseAnActiveSuccessorFromSameContract() {
        var error = assertThrows(ResponseStatusException.class, () -> controller.leave(10L,
                new PersonalLeaveController.LeaveRequest(1L, 99L, null), "owner@test.vn", "ROLE_TENANT"));
        assertEquals(400, error.getStatusCode().value());
        verify(tenants, never()).updateMember(anyLong(), anyMap(), anyString());
    }

    @Test
    void lastOccupantEndsContract() {
        when(tenants.getMembers()).thenReturn(ApiResponse.success(List.of()));
        controller.leave(10L, new PersonalLeaveController.LeaveRequest(1L, null, null), "owner@test.vn", "ROLE_TENANT");
        verify(contracts).terminateContract(10L);
    }

    @Test
    void unpaidInvoiceFromAnyMonthBlocksLeave() {
        when(billing.getInvoices(2L)).thenReturn(List.of(new BillingClient.Invoice(50L, 20L, 2L, "OVERDUE")));
        var error = assertThrows(ResponseStatusException.class, () -> controller.leave(10L,
                new PersonalLeaveController.LeaveRequest(2L, null, null), "member@test.vn", "ROLE_TENANT"));
        assertEquals(409, error.getStatusCode().value());
        verify(tenants, never()).updateMember(anyLong(), anyMap(), anyString());
        verifyNoInteractions(contracts);
    }

    @Test
    void cannotLeaveOnBehalfOfAnotherTenant() {
        var error = assertThrows(ResponseStatusException.class, () -> controller.leave(10L,
                new PersonalLeaveController.LeaveRequest(1L, 2L, null), "member@test.vn", "ROLE_TENANT"));
        assertEquals(403, error.getStatusCode().value());
        verifyNoInteractions(repository, billing);
    }

    @Test
    void nonMemberCannotLeaveEvenWithOwnEmail() {
        when(tenants.getMembers()).thenReturn(ApiResponse.success(List.of()));
        var error = assertThrows(ResponseStatusException.class, () -> controller.leave(10L,
                new PersonalLeaveController.LeaveRequest(2L, null, null), "member@test.vn", "ROLE_TENANT"));
        assertEquals(403, error.getStatusCode().value());
        verifyNoInteractions(contracts, billing);
    }
}
