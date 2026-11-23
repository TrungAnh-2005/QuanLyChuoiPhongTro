package com.rental.contract.controller;

import com.rental.contract.client.RoomClient;
import com.rental.contract.client.TenantClient;
import com.rental.contract.client.dto.RoomDto;
import com.rental.contract.client.dto.TenantDto;
import com.rental.contract.dto.ApiResponse;
import com.rental.contract.entity.*;
import com.rental.contract.publisher.ContractEventPublisher;
import com.rental.contract.repository.*;
import com.rental.contract.service.ReservationService;
import com.rental.contract.service.impl.ContractServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ReservationWorkflowTest {
    final RoomRequestRepository requests = mock(RoomRequestRepository.class);
    final DepositReceiptRepository receipts = mock(DepositReceiptRepository.class);
    final ContractRepository contracts = mock(ContractRepository.class);
    final RoomClient rooms = mock(RoomClient.class);
    final TenantClient tenants = mock(TenantClient.class);
    final ContractEventPublisher events = mock(ContractEventPublisher.class);
    final ContractServiceImpl contractService = new ContractServiceImpl(contracts, tenants, rooms, events);
    final LocalTransactionManager transactions = new LocalTransactionManager();
    final ReservationService reservations = new ReservationService(requests, receipts, rooms, contractService, transactions);
    final Map<String, DepositReceipt> ledger = new HashMap<>();
    RoomRequest request;

    @BeforeEach
    void setup() {
        request = RoomRequest.builder().id(20L).type("RENT").tenantId(1L).targetRoomId(101L)
                .durationMonths(12).build();
        when(requests.saveAndFlush(any())).thenAnswer(call -> {
            RoomRequest saved = call.getArgument(0);
            if (saved.getId() == null) saved.setId(20L);
            request = saved;
            return saved;
        });
        when(requests.save(any())).thenAnswer(call -> call.getArgument(0));
        when(requests.findForReservation(20L)).thenAnswer(call -> Optional.of(request));
        when(requests.findById(20L)).thenAnswer(call -> Optional.of(request));
        when(receipts.findByRequestIdAndReceiptReference(eq(20L), anyString()))
                .thenAnswer(call -> Optional.ofNullable(ledger.get(call.getArgument(1))));
        when(receipts.saveAndFlush(any())).thenAnswer(call -> {
            DepositReceipt receipt = call.getArgument(0);
            ledger.put(receipt.getReceiptReference(), receipt);
            return receipt;
        });
        when(rooms.getRoomById(101L)).thenReturn(ApiResponse.success(RoomDto.builder()
                .id(101L).roomNumber("101").status("AVAILABLE").basePrice(new BigDecimal("3500000")).build()));
        when(rooms.acquireHold(eq(101L), any())).thenAnswer(call -> {
            RoomClient.HoldRequest hold = call.getArgument(1);
            return ApiResponse.success(RoomDto.builder().id(101L).status("HOLDING")
                    .holdRequestId(hold.requestId()).holdExpiresAt(hold.expiresAt()).build());
        });
        when(tenants.getTenantById(1L)).thenReturn(ApiResponse.success(TenantDto.builder().id(1L).fullName("Tenant").build()));
        when(contracts.save(any())).thenAnswer(call -> {
            Contract contract = call.getArgument(0);
            contract.setId(50L);
            return contract;
        });
    }

    @Test
    void selectingDepositImmediatelyHoldsRoomWithoutRecordingMoneyOrCreatingContract() {
        var reserved = reservations.reserve(request);
        assertEquals("HOLDING", reserved.getStatus());
        assertEquals(new BigDecimal("3500000"), reserved.getRequiredDepositAmount());
        assertEquals(new BigDecimal("3500000"), reserved.getRentalPriceSnapshot());
        assertEquals(BigDecimal.ZERO, reserved.getPaidDepositAmount());
        assertTrue(reserved.getHoldExpiresAt().isAfter(Instant.now().plusSeconds(23 * 3600)));
        verify(rooms).acquireHold(eq(101L), argThat(hold -> hold.requestId().equals(20L) && hold.tenantId().equals(1L)));
        verifyNoInteractions(contracts, receipts, events);
    }

    @Test
    void initialMillionCountsTowardOneMonthAndOnlyRemainingBalanceActivatesContract() {
        reservations.reserve(request);
        reservations.confirmReceipt(20L, new BigDecimal("1000000"), "FIRST");
        assertEquals("HOLDING", request.getStatus());
        assertEquals(new BigDecimal("1000000"), request.getPaidDepositAmount());
        assertNull(request.getContractId());
        verify(contracts, never()).save(any());
        when(rooms.getRoomById(101L)).thenReturn(ApiResponse.success(RoomDto.builder().id(101L)
                .roomNumber("101").status("HOLDING").holdRequestId(20L).build()));
        reservations.confirmReceipt(20L, new BigDecimal("2500000"), "BALANCE");
        assertEquals("APPROVED", request.getStatus());
        assertEquals(new BigDecimal("3500000"), request.getPaidDepositAmount());
        assertEquals(50L, request.getContractId());
        var saved = org.mockito.ArgumentCaptor.forClass(Contract.class);
        verify(contracts).save(saved.capture());
        assertEquals(ContractStatus.ACTIVE, saved.getValue().getStatus());
        assertTrue(saved.getValue().isDepositPaid());
        assertEquals(new BigDecimal("3500000"), saved.getValue().getRentalPrice());
        verify(rooms).confirmHold(eq(101L), eq(20L), any());
        verify(rooms, never()).updateRoomStatus(anyLong(), any());
    }

    @Test
    void receiptRetriesDoNotDoubleCountAndOverpaymentIsRejected() {
        reservations.reserve(request);
        reservations.confirmReceipt(20L, new BigDecimal("1000000"), "BANK-123");
        reservations.confirmReceipt(20L, new BigDecimal("1000000.00"), "BANK-123");
        assertEquals(new BigDecimal("1000000"), request.getPaidDepositAmount());
        assertEquals(1, ledger.size());
        assertThrows(ResponseStatusException.class, () -> reservations.confirmReceipt(20L, new BigDecimal("1"), "BANK-123"));
        assertThrows(ResponseStatusException.class, () -> reservations.confirmReceipt(20L, new BigDecimal("2500001"), "TOO-MUCH"));
        assertThrows(ResponseStatusException.class, () -> reservations.confirmReceipt(20L, BigDecimal.ZERO, "ZERO"));
        assertEquals(1, ledger.size());
    }

    @Test
    void cancellingAndExpiringReleaseRoomButPreservePaidMoneyAndReceiptHistory() {
        reservations.reserve(request);
        reservations.confirmReceipt(20L, new BigDecimal("1000000"), "FIRST");
        reservations.cancel(20L);
        assertEquals("CANCELLED", request.getStatus());
        assertEquals(new BigDecimal("1000000"), request.getPaidDepositAmount());
        assertEquals(1, ledger.size());
        verify(rooms).releaseHold(101L, 20L);
        assertThrows(ResponseStatusException.class, () -> reservations.confirmReceipt(20L, new BigDecimal("2500000"), "LATE"));
        verifyNoInteractions(contracts, events);
    }

    @Test
    void expiredHoldCannotReceiveMoneyAndRefreshRetainsAudit() {
        reservations.reserve(request);
        request.setHoldExpiresAt(Instant.now().minusSeconds(1));
        assertThrows(ResponseStatusException.class, () -> reservations.confirmReceipt(20L, new BigDecimal("1000000"), "LATE"));
        when(requests.findExpiredReservationIds(any())).thenReturn(List.of(20L));
        reservations.expireHolds();
        assertEquals("EXPIRED", request.getStatus());
        verify(rooms).releaseHold(101L, 20L);
        assertEquals(BigDecimal.ZERO, request.getPaidDepositAmount());
        verifyNoInteractions(contracts, events);
    }

    ContractWorkflowController controller() {
        return new ContractWorkflowController(contracts, mock(MoveOutSettlementRepository.class), requests,
                mock(RoomRequestVoteRepository.class), contractService, rooms, tenants, reservations, transactions);
    }

    @Test
    void legacyRentApprovalOnlyReservesRoomAndAliasesAreNormalized() {
        request.setType("NEW_RENT");
        controller().approve(20L, "ROLE_STAFF");
        assertEquals("RENT", request.getType());
        assertEquals("HOLDING", request.getStatus());
        assertEquals(BigDecimal.ZERO, request.getPaidDepositAmount());
        assertNull(request.getContractId());
        verifyNoInteractions(contracts, events);
    }

    @Test
    void tenantsAndLookalikeRoleNamesCannotRecordMoneyCancelOrCreateManualContracts() {
        for (String role : List.of("ROLE_TENANT", "ROLE_STAFF_FAKE", "NOT_ROLE_ADMIN", "")) {
            assertEquals(403, assertThrows(ResponseStatusException.class, () -> controller().confirmReservationDeposit(
                    20L, new ContractWorkflowController.DepositReceiptBody(new BigDecimal("1000000"), "FIRST"), role))
                    .getStatusCode().value());
            assertEquals(403, assertThrows(ResponseStatusException.class, () -> controller().cancelReservation(20L, role))
                    .getStatusCode().value());
            assertEquals(403, assertThrows(ResponseStatusException.class, () -> new ContractController(contractService)
                    .createContract(com.rental.contract.dto.CreateContractRequest.builder().build(), role)).getStatusCode().value());
        }
        verifyNoInteractions(rooms, contracts, receipts);
    }

    @Test
    void genericPatchAndDeletionCannotRewriteOrDeleteReservationLedger() {
        reservations.reserve(request);
        var update = new ContractWorkflowController.RoomRequestBody(null, 999L, null, null, null, null, null,
                null, "APPROVED", null, null, null, null, null);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> controller().updateRoomRequest(20L, update, "ROLE_STAFF"))
                .getStatusCode().value());
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> controller().deleteRoomRequest(20L, "ROLE_STAFF"))
                .getStatusCode().value());
        assertEquals("HOLDING", request.getStatus());
        assertNull(request.getContractId());
    }

    @Test
    void fullReceiptRetryCanRecoverRoomAlreadyConfirmedBySameReservation() {
        reservations.reserve(request);
        when(rooms.getRoomById(101L)).thenReturn(ApiResponse.success(RoomDto.builder().id(101L)
                .status("OCCUPIED").holdRequestId(20L).build()));
        reservations.confirmReceipt(20L, new BigDecimal("3500000"), "FULL");
        reservations.confirmReceipt(20L, new BigDecimal("3500000"), "FULL");
        assertEquals("APPROVED", request.getStatus());
        assertEquals(50L, request.getContractId());
        assertEquals(1, ledger.size());
        verify(contracts, times(1)).save(any());
    }

    @Test
    void expiredOldReservationDoesNotReleaseNewOwnersHold() {
        reservations.reserve(request);
        request.setHoldExpiresAt(Instant.now().minusSeconds(1));
        when(requests.findExpiredReservationIds(any())).thenReturn(List.of(20L));
        when(rooms.releaseHold(101L, 20L)).thenThrow(feign.FeignException.errorStatus("releaseHold",
                feign.Response.builder().status(409).reason("Another hold owns the room")
                        .request(feign.Request.create(feign.Request.HttpMethod.DELETE, "http://room/holds/20",
                                Map.of(), (byte[]) null, java.nio.charset.StandardCharsets.UTF_8, null)).build()));
        when(rooms.getRoomById(101L)).thenReturn(ApiResponse.success(RoomDto.builder().id(101L)
                .status("HOLDING").holdRequestId(21L).build()));
        reservations.expireHolds();
        assertEquals("EXPIRED", request.getStatus());
        verify(rooms, never()).releaseHold(101L, 21L);
    }

    @Test
    void rentalRequestCreationIgnoresForgedApprovalAndContractId() {
        var body = new ContractWorkflowController.RoomRequestBody("HOLD", 999L, 1L, 101L, null, 12, null,
                false, "APPROVED", LocalDateTime.now(), null, null, null, null);
        var result = (RoomRequest) controller().createRoomRequest(body).get("data");
        assertEquals("RENT", result.getType());
        assertEquals("HOLDING", result.getStatus());
        assertNull(result.getContractId());
        assertEquals(BigDecimal.ZERO, result.getPaidDepositAmount());
        verifyNoInteractions(contracts, events);
    }

    @Test
    void oldDepositEndpointCannotActivateDraftContract() {
        var draft = Contract.builder().id(50L).status(ContractStatus.DRAFT).build();
        when(contracts.findById(50L)).thenReturn(Optional.of(draft));
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> controller().deposit(50L, "ROLE_ADMIN")).getStatusCode().value());
        assertEquals(ContractStatus.DRAFT, draft.getStatus());
        assertFalse(draft.isDepositPaid());
        verify(contracts, never()).save(any());
    }

    @Test
    void remoteConfirmationCanBeRecoveredAfterLocalDeadlineWithoutReopeningExpiredRooms() {
        reservations.reserve(request);
        reservations.confirmReceipt(20L, new BigDecimal("1000000"), "FIRST");
        request.setHoldExpiresAt(Instant.now().minusSeconds(60));
        when(rooms.getRoomById(101L)).thenReturn(ApiResponse.success(RoomDto.builder().id(101L)
                .status("OCCUPIED").holdRequestId(20L).build()));
        reservations.confirmReceipt(20L, new BigDecimal("2500000"), "BALANCE");
        assertEquals("APPROVED", request.getStatus());
        assertEquals(50L, request.getContractId());
        assertEquals(new BigDecimal("3500000"), request.getPaidDepositAmount());
    }

    @Test
    void lostHoldResponseKeepsPendingIdentityRecoverableWithoutAcceptingPayments() {
        when(rooms.acquireHold(eq(101L), any())).thenThrow(feign.FeignException.errorStatus("acquireHold",
                feign.Response.builder().status(504).reason("Hold committed but response was lost")
                        .request(feign.Request.create(feign.Request.HttpMethod.POST, "http://room/holds",
                                Map.of(), (byte[]) null, java.nio.charset.StandardCharsets.UTF_8, null)).build()));
        assertThrows(ResponseStatusException.class, () -> reservations.reserve(request));
        assertEquals("PENDING", request.getStatus());
        assertEquals(20L, request.getId());
        assertEquals(new BigDecimal("3500000"), request.getRentalPriceSnapshot());
        assertThrows(ResponseStatusException.class,
                () -> reservations.confirmReceipt(20L, new BigDecimal("1000000"), "EARLY"));
        verify(receipts, never()).saveAndFlush(any());
    }

    @Test
    void committedIntentSurvivesLostResponseAndRepeatedPostReusesIdPriceAndDeadlineOutsideTransaction() {
        var committed = transactionalIntentStore();
        var attempts = new java.util.concurrent.atomic.AtomicInteger();
        var tokens = new ArrayList<RoomClient.HoldRequest>();
        when(rooms.acquireHold(eq(101L), any())).thenAnswer(call -> {
            assertFalse(org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive(),
                    "Room acquisition must not retain a contract DB transaction while room-service calls GET contracts");
            RoomClient.HoldRequest hold = call.getArgument(1);
            tokens.add(hold);
            assertNotNull(committed.get(), "The reservation identity must already be committed before remote acquisition");
            assertEquals("PENDING", committed.get().getStatus());
            assertEquals(20L, committed.get().getId());
            if (attempts.incrementAndGet() == 1) throw remoteError(504);
            return ApiResponse.success(RoomDto.builder().id(101L).status("HOLDING").holdRequestId(hold.requestId()).build());
        });
        var proxyFactory = new org.springframework.aop.framework.ProxyFactory(controller());
        proxyFactory.addAdvice(new org.springframework.transaction.interceptor.TransactionInterceptor(transactions,
                new org.springframework.transaction.annotation.AnnotationTransactionAttributeSource()));
        var proxiedController = (ContractWorkflowController) proxyFactory.getProxy();
        var body = new ContractWorkflowController.RoomRequestBody("RENT", null, 1L, 101L, null, 12, null,
                false, null, null, null, null, null, null);
        var callerTransaction = new org.springframework.transaction.support.TransactionTemplate(transactions);
        assertThrows(ResponseStatusException.class, () -> callerTransaction.execute(status -> proxiedController.createRoomRequest(body)));
        assertEquals("PENDING", committed.get().getStatus());
        assertEquals(new BigDecimal("3500000"), committed.get().getRentalPriceSnapshot());
        when(rooms.getRoomById(101L)).thenReturn(ApiResponse.success(RoomDto.builder().id(101L)
                .status("HOLDING").basePrice(new BigDecimal("4500000")).holdRequestId(20L).build()));
        callerTransaction.execute(status -> proxiedController.createRoomRequest(body));
        assertEquals("HOLDING", committed.get().getStatus());
        assertEquals(new BigDecimal("3500000"), committed.get().getRentalPriceSnapshot());
        assertEquals(tokens.get(0), tokens.get(1));
        verify(requests, times(1)).saveAndFlush(any());
    }

    @Test
    void failedFinalCommitLeavesCommittedPendingIntentForSameTokenRetry() {
        var committed = transactionalIntentStore();
        var attempts = new java.util.concurrent.atomic.AtomicInteger();
        when(rooms.acquireHold(eq(101L), any())).thenAnswer(call -> {
            assertFalse(org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive());
            if (attempts.incrementAndGet() == 1) transactions.failNextCommit = true;
            return ApiResponse.success(RoomDto.builder().id(101L).status("HOLDING").holdRequestId(20L).build());
        });
        assertThrows(org.springframework.transaction.TransactionSystemException.class,
                () -> reservations.reserve(freshRentalIntent()));
        assertEquals("PENDING", committed.get().getStatus());
        reservations.reserve(freshRentalIntent());
        assertEquals("HOLDING", committed.get().getStatus());
        assertEquals(20L, committed.get().getId());
        verify(rooms, times(2)).acquireHold(eq(101L), argThat(hold -> hold.requestId().equals(20L)));
        verify(requests, times(1)).saveAndFlush(any());
    }

    @Test
    void definiteHoldRejectionIsRetainedAndUncertainPendingIntentExpires() {
        when(rooms.acquireHold(eq(101L), any())).thenThrow(remoteError(409));
        assertThrows(ResponseStatusException.class, () -> reservations.reserve(request));
        assertEquals("REJECTED", request.getStatus());
        assertNull(request.getReservationKey());
        request.setStatus("PENDING");
        request.setReservationKey("1:101");
        request.setHoldExpiresAt(Instant.now().minusSeconds(1));
        when(requests.findExpiredReservationIds(any())).thenReturn(List.of(20L));
        reservations.expireHolds();
        assertEquals("EXPIRED", request.getStatus());
        assertNull(request.getReservationKey());
        assertEquals(BigDecimal.ZERO, request.getPaidDepositAmount());
        verify(rooms).releaseHold(101L, 20L);
    }

    private RoomRequest freshRentalIntent() {
        return RoomRequest.builder().type("RENT").tenantId(1L).targetRoomId(101L).durationMonths(12).build();
    }

    private java.util.concurrent.atomic.AtomicReference<RoomRequest> transactionalIntentStore() {
        var committed = new java.util.concurrent.atomic.AtomicReference<RoomRequest>();
        org.mockito.stubbing.Answer<RoomRequest> save = call -> {
            assertTrue(org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive());
            RoomRequest changed = call.getArgument(0);
            if (changed.getId() == null) changed.setId(20L);
            RoomRequest snapshot = copyIntent(changed);
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override public void afterCommit() { committed.set(snapshot); }
                    });
            return changed;
        };
        doAnswer(save).when(requests).saveAndFlush(any());
        doAnswer(save).when(requests).save(any());
        when(requests.findReservationIdByKey("1:101")).thenAnswer(call -> Optional.ofNullable(committed.get()).map(RoomRequest::getId));
        when(requests.findForReservation(20L)).thenAnswer(call -> Optional.ofNullable(committed.get()).map(this::copyIntent));
        return committed;
    }

    private RoomRequest copyIntent(RoomRequest source) {
        return RoomRequest.builder().id(source.getId()).type(source.getType()).tenantId(source.getTenantId())
                .targetRoomId(source.getTargetRoomId()).durationMonths(source.getDurationMonths()).status(source.getStatus())
                .rentalPriceSnapshot(source.getRentalPriceSnapshot()).requiredDepositAmount(source.getRequiredDepositAmount())
                .paidDepositAmount(source.getPaidDepositAmount()).holdExpiresAt(source.getHoldExpiresAt())
                .reservationKey(source.getReservationKey()).contractId(source.getContractId()).build();
    }

    private static feign.FeignException remoteError(int status) {
        return feign.FeignException.errorStatus("acquireHold", feign.Response.builder().status(status).reason("Remote hold response")
                .request(feign.Request.create(feign.Request.HttpMethod.POST, "http://room/holds", Map.of(),
                        (byte[]) null, java.nio.charset.StandardCharsets.UTF_8, null)).build());
    }
}

/** Runs Spring's real transaction synchronization/suspension without introducing an external test database. */
final class LocalTransactionManager extends org.springframework.transaction.support.AbstractPlatformTransactionManager {
    private final ThreadLocal<State> current = new ThreadLocal<>();
    boolean failNextCommit;

    LocalTransactionManager() { setRollbackOnCommitFailure(true); }

    private static class State implements org.springframework.transaction.support.SmartTransactionObject {
        boolean active;
        boolean rollbackOnly;
        @Override public boolean isRollbackOnly() { return rollbackOnly; }
        @Override public void flush() {}
    }

    @Override protected Object doGetTransaction() { return current.get() != null ? current.get() : new State(); }
    @Override protected boolean isExistingTransaction(Object transaction) { return ((State) transaction).active; }
    @Override protected void doBegin(Object transaction, org.springframework.transaction.TransactionDefinition definition) {
        State state = (State) transaction;
        state.active = true;
        current.set(state);
    }
    @Override protected Object doSuspend(Object transaction) { current.remove(); return transaction; }
    @Override protected void doResume(Object transaction, Object suspendedResources) { current.set((State) suspendedResources); }
    @Override protected void doCommit(org.springframework.transaction.support.DefaultTransactionStatus status) {
        if (failNextCommit) {
            failNextCommit = false;
            throw new org.springframework.transaction.TransactionSystemException("Simulated database commit failure");
        }
    }
    @Override protected void doRollback(org.springframework.transaction.support.DefaultTransactionStatus status) {}
    @Override protected void doSetRollbackOnly(org.springframework.transaction.support.DefaultTransactionStatus status) {
        ((State) status.getTransaction()).rollbackOnly = true;
    }
    @Override protected void doCleanupAfterCompletion(Object transaction) {
        ((State) transaction).active = false;
        current.remove();
    }
}
