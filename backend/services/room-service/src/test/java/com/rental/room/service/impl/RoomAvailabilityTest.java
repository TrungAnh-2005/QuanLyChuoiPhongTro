package com.rental.room.service.impl;

import com.rental.room.entity.*;
import com.rental.room.exception.AppException;
import com.rental.room.repository.RoomRepository;
import com.rental.room.repository.BoardingHouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RoomAvailabilityTest {
    private final RoomRepository rooms = mock(RoomRepository.class);
    private final RoomOccupancyGuard occupants = mock(RoomOccupancyGuard.class);
    private final BoardingHouseRepository houses = mock(BoardingHouseRepository.class);
    private final RoomAvailabilityService service = new RoomAvailabilityService(rooms, occupants, houses);
    private Room room;
    private final Instant future = Instant.now().plusSeconds(24 * 60 * 60);

    @BeforeEach void setup() {
        BoardingHouse house = BoardingHouse.builder().id(1L).status("ACTIVE").build();
        room = Room.builder().id(1L).status(RoomStatus.AVAILABLE)
                .floor(Floor.builder().building(Building.builder().boardingHouse(house).build()).build()).build();
        when(rooms.findLockedById(1L)).thenReturn(Optional.of(room));
        when(rooms.findHouseIdByRoomId(1L)).thenReturn(Optional.of(1L));
        when(houses.findLockedById(1L)).thenReturn(Optional.of(house));
    }

    @Test void firstHoldWinsAndSameRequestIsIdempotent() {
        service.hold(1L, 100L, 7L, future);
        assertEquals(RoomStatus.HOLDING, room.getStatus());
        assertEquals(100L, room.getHoldRequestId());
        service.hold(1L, 100L, 7L, future.plusSeconds(3600));
        assertEquals(future, room.getHoldExpiresAt(), "Retries must not extend a hold");
        assertThrows(AppException.class, () -> service.hold(1L, 101L, 8L, future));
        verify(occupants, times(1)).requireVacant(1L);
    }

    @Test void wrongTenantCannotConsumeAHoldAndCorrectRetryIsIdempotent() {
        service.hold(1L, 100L, 7L, future);
        assertThrows(AppException.class, () -> service.confirmHold(1L, 100L, 8L));
        assertThrows(AppException.class, () -> service.confirmHold(1L, 101L, 7L));
        service.confirmHold(1L, 100L, 7L);
        assertEquals(RoomStatus.OCCUPIED, room.getStatus());
        service.confirmHold(1L, 100L, 7L);
        assertThrows(AppException.class, () -> service.releaseHold(1L, 100L));
    }

    @Test void expiredHoldCannotActivateAndExpiryCannotReleaseAnOccupiedRoom() {
        service.hold(1L, 100L, 7L, future);
        room.setHoldExpiresAt(Instant.now().minusSeconds(1));
        assertThrows(AppException.class, () -> service.confirmHold(1L, 100L, 7L));
        when(rooms.findExpiredHoldIds(eq(RoomStatus.HOLDING), any(), any())).thenReturn(List.of(1L));
        service.expireHolds();
        assertEquals(RoomStatus.AVAILABLE, room.getStatus());
        assertNull(room.getHoldRequestId());
        service.hold(1L, 101L, 8L, future);
        service.confirmHold(1L, 101L, 8L);
        service.expireHolds();
        assertEquals(RoomStatus.OCCUPIED, room.getStatus());
    }

    @Test void expiredReservationCannotReleaseANewerHold() {
        service.hold(1L, 100L, 7L, future);
        room.setHoldExpiresAt(Instant.now().minusSeconds(1));
        service.hold(1L, 101L, 8L, future);
        assertThrows(AppException.class, () -> service.releaseHold(1L, 100L));
        assertEquals(101L, room.getHoldRequestId());
        service.releaseHold(1L, 101L);
        service.releaseHold(1L, 101L);
        assertEquals(RoomStatus.AVAILABLE, room.getStatus());
    }

    @Test void maintenanceRequiresAVacantRoomAndMatchingTicketToFinish() {
        service.startMaintenance(1L, 200L);
        service.startMaintenance(1L, 200L);
        assertEquals(RoomStatus.MAINTENANCE, room.getStatus());
        assertThrows(AppException.class, () -> service.startMaintenance(1L, 201L));
        assertThrows(AppException.class, () -> service.hold(1L, 100L, 7L, future));
        assertThrows(AppException.class, () -> service.finishMaintenance(1L, 201L));
        service.finishMaintenance(1L, 200L);
        service.finishMaintenance(1L, 200L);
        assertEquals(RoomStatus.AVAILABLE, room.getStatus());
    }

    @Test void occupiedOrHeldOrLockedRoomsCannotStartMaintenance() {
        for (RoomStatus status : List.of(RoomStatus.OCCUPIED, RoomStatus.HOLDING, RoomStatus.LOCKED)) {
            room.setStatus(status);
            assertThrows(AppException.class, () -> service.startMaintenance(1L, 200L));
        }
    }

    @Test void unapprovedAndLockedHousesCannotAcceptNewHolds() {
        for (String status : List.of("PENDING_APPROVAL", "LOCKED")) {
            room.getFloor().getBuilding().getBoardingHouse().setStatus(status);
            assertThrows(AppException.class, () -> service.hold(1L, 100L, 7L, future));
        }
    }

    @Test void staleAvailableStatusDoesNotOverrideActiveOccupants() {
        doThrow(new AppException("Occupied", org.springframework.http.HttpStatus.CONFLICT, "ROOM_OCCUPIED"))
                .when(occupants).requireVacant(1L);
        assertThrows(AppException.class, () -> service.hold(1L, 100L, 7L, future));
        assertThrows(AppException.class, () -> service.startMaintenance(1L, 200L));
        assertEquals(RoomStatus.AVAILABLE, room.getStatus());
    }
}
