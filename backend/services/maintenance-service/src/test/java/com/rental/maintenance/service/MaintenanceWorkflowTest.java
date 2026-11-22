package com.rental.maintenance.service;

import com.rental.maintenance.client.RoomClient;
import com.rental.maintenance.dto.*;
import com.rental.maintenance.entity.*;
import com.rental.maintenance.publisher.MaintenanceEventPublisher;
import com.rental.maintenance.repository.MaintenanceRepository;
import com.rental.maintenance.service.impl.MaintenanceServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import feign.Request;
import feign.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceWorkflowTest {
    @Mock MaintenanceRepository repository;
    @Mock MaintenanceEventPublisher publisher;
    @Mock RoomClient rooms;
    @Mock PlatformTransactionManager transactionManager;
    @InjectMocks MaintenanceServiceImpl service;
    private MaintenanceRequest persistedTicket;

    @BeforeEach
    void setUp() {
        lenient().when(transactionManager.getTransaction(any())).thenReturn(mock(TransactionStatus.class));
        lenient().when(repository.save(any())).thenAnswer(invocation -> persist(invocation.getArgument(0)));
        lenient().when(repository.saveAndFlush(any())).thenAnswer(invocation -> persist(invocation.getArgument(0)));
        lenient().when(repository.findByIdForUpdate(anyLong())).thenAnswer(invocation -> Optional.ofNullable(persistedTicket));
    }

    private MaintenanceRequest persist(MaintenanceRequest ticket) {
        if (ticket.getId() == null) ticket.setId(17L);
        persistedTicket = ticket;
        return ticket;
    }

    @Test
    void blockingCreateClaimsRoomUsingDurableTicketId() {
        MaintenanceResponse response = service.createMaintenanceRequest(create(true));
        assertEquals(17L, response.getId());
        assertEquals(Boolean.TRUE, response.getBlocksRental());
        var ordered = inOrder(repository, transactionManager, rooms);
        ordered.verify(repository).saveAndFlush(any());
        ordered.verify(transactionManager).commit(any());
        ordered.verify(rooms).startMaintenance(3L, new RoomMaintenanceRequest(17L));
    }

    @Test
    void occupiedRoomRepairDoesNotClaimOrReleaseRoom() {
        MaintenanceResponse created = service.createMaintenanceRequest(create(false));
        assertEquals(Boolean.FALSE, created.getBlocksRental());
        MaintenanceRequest ticket = ticket(false, MaintenanceStatus.PENDING);
        stubTicket(ticket);
        assertEquals(MaintenanceStatus.RESOLVED, service.updateMaintenanceStatus(17L, update(MaintenanceStatus.RESOLVED)).getStatus());
        verifyNoInteractions(rooms);
    }

    @Test
    void terminalBlockingStatusesReleaseMatchingRoomBeforeSavingCompletion() {
        for (MaintenanceStatus status : new MaintenanceStatus[]{MaintenanceStatus.RESOLVED, MaintenanceStatus.COMPLETED,
                MaintenanceStatus.CANCELLED, MaintenanceStatus.REJECTED}) {
            reset(rooms);
            MaintenanceRequest ticket = ticket(true, MaintenanceStatus.IN_PROGRESS);
            stubTicket(ticket);
            assertEquals(status, service.updateMaintenanceStatus(17L, update(status)).getStatus());
            verify(rooms).finishMaintenance(3L, new RoomMaintenanceRequest(17L));
        }
    }

    @Test
    void failedRemoteFinishLeavesTicketOpen() {
        MaintenanceRequest ticket = ticket(true, MaintenanceStatus.IN_PROGRESS);
        stubTicket(ticket);
        doThrow(new IllegalStateException("room unavailable")).when(rooms).finishMaintenance(anyLong(), any());
        assertThrows(ResponseStatusException.class,
                () -> service.updateMaintenanceStatus(17L, update(MaintenanceStatus.RESOLVED)));
        assertEquals(MaintenanceStatus.IN_PROGRESS, ticket.getStatus());
        assertNull(ticket.getResolvedAt());
        verify(repository, never()).save(ticket);
        verifyNoInteractions(publisher);
    }

    @Test
    void completedBlockingTicketIsIdempotentAndCannotReopen() {
        MaintenanceRequest ticket = ticket(true, MaintenanceStatus.RESOLVED);
        stubTicket(ticket);
        assertEquals(MaintenanceStatus.RESOLVED, service.updateMaintenanceStatus(17L, update(MaintenanceStatus.RESOLVED)).getStatus());
        assertThrows(ResponseStatusException.class,
                () -> service.updateMaintenanceStatus(17L, update(MaintenanceStatus.PENDING)));
        assertEquals(MaintenanceStatus.RESOLVED, ticket.getStatus());
        verifyNoInteractions(rooms, publisher);
    }

    @Test
    void definiteStartRejectionPreservesRejectedTicketWithoutReleasingOtherTicket() {
        Request request = Request.create(Request.HttpMethod.POST, "/maintenance/start", Map.of(), null, StandardCharsets.UTF_8, null);
        doThrow(new FeignException.Conflict("busy", request, null, Map.of())).when(rooms).startMaintenance(anyLong(), any());
        ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                () -> service.createMaintenanceRequest(create(true)));
        assertEquals(409, failure.getStatusCode().value());
        verify(repository, atLeastOnce()).saveAndFlush(argThat(ticket -> ticket.getStatus() == MaintenanceStatus.REJECTED));
        verify(rooms, never()).finishMaintenance(anyLong(), any());
        verify(repository, never()).delete(any());
    }

    @Test
    void failedCreatedEventCompensatesRoomAndRetainsCancelledAudit() {
        doThrow(new IllegalStateException("rabbit unavailable")).when(publisher).publishMaintenanceCreated(any());
        assertThrows(ResponseStatusException.class, () -> service.createMaintenanceRequest(create(true)));
        verify(rooms).finishMaintenance(3L, new RoomMaintenanceRequest(17L));
        verify(repository, atLeastOnce()).saveAndFlush(argThat(ticket -> ticket.getStatus() == MaintenanceStatus.CANCELLED));
        verify(repository, never()).delete(any());
    }

    @Test
    void uncertainClaimAndFailedCompensationRetainRecoverableOpenTicket() {
        doThrow(new IllegalStateException("start timed out")).when(rooms).startMaintenance(anyLong(), any());
        doThrow(new IllegalStateException("finish timed out")).when(rooms).finishMaintenance(anyLong(), any());
        assertThrows(ResponseStatusException.class, () -> service.createMaintenanceRequest(create(true)));
        verify(repository, atLeastOnce()).saveAndFlush(argThat(ticket -> ticket.getStatus() == MaintenanceStatus.PENDING
                && ticket.getNote() != null && ticket.getNote().contains("17")));
        verify(repository, never()).delete(any());
    }

    @Test
    void httpTimeoutStillCompensatesPossiblyClaimedRoom() {
        Request request = Request.create(Request.HttpMethod.POST, "/maintenance/start", Map.of(), null, StandardCharsets.UTF_8, null);
        FeignException timeout = FeignException.errorStatus("startMaintenance", Response.builder()
                .status(408).reason("Request timeout").headers(Map.of()).request(request).build());
        doThrow(timeout).when(rooms).startMaintenance(anyLong(), any());
        assertThrows(ResponseStatusException.class, () -> service.createMaintenanceRequest(create(true)));
        verify(rooms).finishMaintenance(3L, new RoomMaintenanceRequest(17L));
        assertEquals(MaintenanceStatus.CANCELLED, persistedTicket.getStatus());
    }

    @Test
    void completionNotificationWaitsForCommitAndCannotUndoClosedTicket() {
        MaintenanceRequest ticket = ticket(true, MaintenanceStatus.IN_PROGRESS);
        stubTicket(ticket);
        doThrow(new IllegalStateException("rabbit unavailable")).when(publisher).publishMaintenanceCompleted(any());
        TransactionSynchronizationManager.initSynchronization();
        try {
            assertEquals(MaintenanceStatus.RESOLVED,
                    service.updateMaintenanceStatus(17L, update(MaintenanceStatus.RESOLVED)).getStatus());
            verifyNoInteractions(publisher);
            TransactionSynchronizationManager.getSynchronizations().forEach(sync -> assertDoesNotThrow(sync::afterCommit));
            assertEquals(MaintenanceStatus.RESOLVED, ticket.getStatus());
            verify(publisher).publishMaintenanceCompleted(any());
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void ticketClosedDuringClaimPreparationCannotClaimRoomLater() {
        when(repository.findByIdForUpdate(17L)).thenReturn(Optional.of(ticket(true, MaintenanceStatus.CANCELLED)));
        assertThrows(ResponseStatusException.class, () -> service.createMaintenanceRequest(create(true)));
        verifyNoInteractions(rooms, publisher);
    }

    @Test
    void lostReleaseResponseThenNewOwnerCanCloseOldAuditWithoutMutatingNewOwner() {
        for (RoomMaintenanceSnapshot owner : new RoomMaintenanceSnapshot[]{
                new RoomMaintenanceSnapshot("HOLDING", null), new RoomMaintenanceSnapshot("OCCUPIED", null),
                new RoomMaintenanceSnapshot("LOCKED", null), new RoomMaintenanceSnapshot("MAINTENANCE", 99L)}) {
            reset(rooms, publisher);
            MaintenanceRequest ticket = ticket(true, MaintenanceStatus.IN_PROGRESS);
            stubTicket(ticket);
            doThrow(new IllegalStateException("release succeeded but response lost"))
                    .doThrow(remoteError(409)).when(rooms).finishMaintenance(3L, new RoomMaintenanceRequest(17L));
            assertThrows(ResponseStatusException.class,
                    () -> service.updateMaintenanceStatus(17L, update(MaintenanceStatus.RESOLVED)));
            assertEquals(MaintenanceStatus.IN_PROGRESS, ticket.getStatus());
            when(rooms.getRoom(3L)).thenReturn(new RoomLookupResponse(true, owner));
            assertEquals(MaintenanceStatus.RESOLVED,
                    service.updateMaintenanceStatus(17L, update(MaintenanceStatus.RESOLVED)).getStatus());
            assertEquals(MaintenanceStatus.RESOLVED,
                    service.updateMaintenanceStatus(17L, update(MaintenanceStatus.RESOLVED)).getStatus());
            verify(rooms, times(2)).finishMaintenance(3L, new RoomMaintenanceRequest(17L));
            verify(rooms).getRoom(3L);
            verify(rooms, never()).startMaintenance(anyLong(), any());
            verify(publisher).publishMaintenanceCompleted(any());
        }
    }

    @Test
    void conflictingFinishCannotCloseTicketThatStillOwnsMaintenanceRoom() {
        MaintenanceRequest ticket = ticket(true, MaintenanceStatus.IN_PROGRESS);
        stubTicket(ticket);
        doThrow(remoteError(409)).when(rooms).finishMaintenance(anyLong(), any());
        when(rooms.getRoom(3L)).thenReturn(new RoomLookupResponse(true, new RoomMaintenanceSnapshot("MAINTENANCE", 17L)));
        ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                () -> service.updateMaintenanceStatus(17L, update(MaintenanceStatus.RESOLVED)));
        assertEquals(409, failure.getStatusCode().value());
        assertEquals(MaintenanceStatus.IN_PROGRESS, ticket.getStatus());
        verify(rooms).getRoom(3L);
        verifyNoInteractions(publisher);
    }

    @Test
    void failedOwnershipReadKeepsConflictingTicketOpen() {
        MaintenanceRequest ticket = ticket(true, MaintenanceStatus.IN_PROGRESS);
        stubTicket(ticket);
        doThrow(remoteError(409)).when(rooms).finishMaintenance(anyLong(), any());
        when(rooms.getRoom(3L)).thenThrow(remoteError(503));
        assertThrows(ResponseStatusException.class,
                () -> service.updateMaintenanceStatus(17L, update(MaintenanceStatus.RESOLVED)));
        assertEquals(MaintenanceStatus.IN_PROGRESS, ticket.getStatus());
        verify(rooms).getRoom(3L);
        verifyNoInteractions(publisher);
    }

    @Test
    void deletedRoomCanCloseRetainedMaintenanceAudit() {
        MaintenanceRequest ticket = ticket(true, MaintenanceStatus.IN_PROGRESS);
        stubTicket(ticket);
        doThrow(remoteError(404)).when(rooms).finishMaintenance(anyLong(), any());
        when(rooms.getRoom(3L)).thenThrow(remoteError(404));
        assertEquals(MaintenanceStatus.CANCELLED,
                service.updateMaintenanceStatus(17L, update(MaintenanceStatus.CANCELLED)).getStatus());
        verify(repository, never()).delete(any());
    }

    @Test
    void closedBlockingTicketAllowsMetadataEditsWithoutReleasingOrPublishingAgain() {
        MaintenanceRequest ticket = ticket(true, MaintenanceStatus.RESOLVED);
        LocalDateTime resolvedAt = LocalDateTime.of(2026, 11, 22, 15, 30);
        ticket.setResolvedAt(resolvedAt);
        stubTicket(ticket);
        UpdateMaintenanceStatusRequest request = UpdateMaintenanceStatusRequest.builder()
                .status(MaintenanceStatus.RESOLVED).cost(new BigDecimal("250000"))
                .assignedTo("Staff A").note("Replaced water valve").build();
        MaintenanceResponse response = service.updateMaintenanceStatus(17L, request);
        assertEquals(new BigDecimal("250000"), response.getCost());
        assertEquals("Staff A", response.getAssignedTo());
        assertEquals("Replaced water valve", response.getNote());
        assertEquals(resolvedAt, response.getResolvedAt());
        assertEquals(MaintenanceStatus.RESOLVED, response.getStatus());
        verify(repository).save(ticket);
        verifyNoInteractions(rooms, publisher);
    }

    @Test
    void ownershipReconciliationReadsActualRoomResponseEnvelope() throws Exception {
        MaintenanceRequest ticket = ticket(true, MaintenanceStatus.IN_PROGRESS);
        stubTicket(ticket);
        doThrow(remoteError(409)).when(rooms).finishMaintenance(anyLong(), any());
        String json = "{\"success\":true,\"message\":\"Get room detail successfully\","
                + "\"data\":{\"id\":3,\"status\":\"HOLDING\",\"maintenanceRequestId\":null,\"holdRequestId\":91},"
                + "\"timestamp\":\"2026-11-22T14:20:00Z\"}";
        Object decoded = new ObjectMapper().readValue(json,
                RoomClient.class.getMethod("getRoom", Long.class).getReturnType());
        doReturn(decoded).when(rooms).getRoom(3L);
        assertEquals(MaintenanceStatus.RESOLVED,
                service.updateMaintenanceStatus(17L, update(MaintenanceStatus.RESOLVED)).getStatus());
        verify(rooms, never()).startMaintenance(anyLong(), any());
    }

    private FeignException remoteError(int status) {
        Request request = Request.create(Request.HttpMethod.POST, "/maintenance/finish", Map.of(), null, StandardCharsets.UTF_8, null);
        return FeignException.errorStatus("finishMaintenance", Response.builder()
                .status(status).reason("Room workflow error").headers(Map.of()).request(request).build());
    }

    private void stubTicket(MaintenanceRequest ticket) {
        lenient().when(repository.findById(17L)).thenReturn(Optional.of(ticket));
        lenient().when(repository.findByIdForUpdate(17L)).thenReturn(Optional.of(ticket));
    }

    private CreateMaintenanceRequest create(boolean blocksRental) {
        return CreateMaintenanceRequest.builder().roomId(3L).tenantId(blocksRental ? null : 8L)
                .title("Repair").description("Leak").blocksRental(blocksRental).build();
    }

    private MaintenanceRequest ticket(boolean blocksRental, MaintenanceStatus status) {
        return MaintenanceRequest.builder().id(17L).roomId(3L).tenantId(blocksRental ? null : 8L)
                .title("Repair").description("Leak").priority(MaintenancePriority.MEDIUM)
                .blocksRental(blocksRental).status(status).build();
    }

    private UpdateMaintenanceStatusRequest update(MaintenanceStatus status) {
        return UpdateMaintenanceStatusRequest.builder().status(status).build();
    }
}
