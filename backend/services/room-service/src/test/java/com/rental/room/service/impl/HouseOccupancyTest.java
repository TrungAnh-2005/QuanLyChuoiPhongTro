package com.rental.room.service.impl;

import com.rental.room.dto.CreateBoardingHouseRequest;
import com.rental.room.entity.*;
import com.rental.room.exception.AppException;
import com.rental.room.repository.BoardingHouseRepository;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class HouseOccupancyTest {
    private final BoardingHouseRepository houses = mock(BoardingHouseRepository.class);
    private final BoardingHouseServiceImpl service = new BoardingHouseServiceImpl(houses);

    private BoardingHouse house(RoomStatus status) {
        Floor floor = Floor.builder().rooms(List.of(Room.builder().status(status).build())).build();
        Building building = Building.builder().floors(List.of(floor)).build();
        BoardingHouse house = BoardingHouse.builder().id(1L).name("House").address("Address").status("ACTIVE")
                .buildings(List.of(building)).build();
        when(houses.findById(1L)).thenReturn(Optional.of(house));
        when(houses.findLockedById(1L)).thenReturn(Optional.of(house));
        when(houses.save(any())).thenAnswer(call -> call.getArgument(0));
        return house;
    }

    private CreateBoardingHouseRequest update(String status) {
        return CreateBoardingHouseRequest.builder().name("House").address("Address").status(status).build();
    }

    @Test void occupiedHouseCannotBeLocked() {
        BoardingHouse house = house(RoomStatus.OCCUPIED);
        var error = assertThrows(AppException.class, () -> service.updateBoardingHouse(1L, update("LOCKED")));
        assertEquals("HOUSE_OCCUPIED", error.getErrorCode());
        assertEquals("ACTIVE", house.getStatus());
        verify(houses, never()).save(any());
    }

    @Test void occupiedHouseCannotBeDeleted() {
        house(RoomStatus.OCCUPIED);
        var error = assertThrows(AppException.class, () -> service.deleteBoardingHouse(1L));
        assertEquals("HOUSE_OCCUPIED", error.getErrorCode());
        verify(houses, never()).delete(any());
    }

    @Test void vacantHouseCanBeLockedAndUnlocked() {
        house(RoomStatus.AVAILABLE);
        assertEquals("LOCKED", service.updateBoardingHouse(1L, update("LOCKED")).getStatus());
        assertEquals("ACTIVE", service.updateBoardingHouse(1L, update("ACTIVE")).getStatus());
    }

    @Test void vacantHouseCanBeDeleted() {
        BoardingHouse house = house(RoomStatus.AVAILABLE);
        service.deleteBoardingHouse(1L);
        verify(houses).delete(house);
    }

    @Test void heldOrMaintenanceRoomCannotBeDeletedWithItsHouse() {
        house(RoomStatus.HOLDING);
        assertThrows(AppException.class, () -> service.deleteBoardingHouse(1L));
        assertThrows(AppException.class, () -> service.updateBoardingHouse(1L, update("LOCKED")));
        house(RoomStatus.MAINTENANCE);
        assertThrows(AppException.class, () -> service.deleteBoardingHouse(1L));
        verify(houses, never()).delete(any());
    }

    @Test void newHouseAlwaysWaitsForApprovalEvenIfClientSendsActive() {
        when(houses.save(any())).thenAnswer(call -> call.getArgument(0));
        assertEquals("PENDING_APPROVAL", service.createBoardingHouse(update("ACTIVE")).getStatus());
    }

    @Test void pendingHouseCannotBypassApprovalByEditingStatus() {
        BoardingHouse house = house(RoomStatus.AVAILABLE);
        house.setStatus("PENDING_APPROVAL");
        for (String status : List.of("ACTIVE", "LOCKED")) {
            assertThrows(AppException.class, () -> service.updateBoardingHouse(1L, update(status)));
            assertEquals("PENDING_APPROVAL", house.getStatus());
        }
        assertEquals("PENDING_APPROVAL", service.updateBoardingHouse(1L, update(null)).getStatus());
    }

    @Test void explicitApprovalActivatesOnlyPendingHouses() {
        BoardingHouse house = house(RoomStatus.AVAILABLE);
        house.setStatus("PENDING_APPROVAL");
        assertEquals("ACTIVE", service.approveBoardingHouse(1L).getStatus());
        house.setStatus("LOCKED");
        assertThrows(AppException.class, () -> service.approveBoardingHouse(1L));
        assertEquals("LOCKED", house.getStatus());
    }
}
