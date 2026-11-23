package com.rental.room.service.impl;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rental.room.dto.UpdateRoomRequest;
import com.rental.room.dto.CreateRoomRequest;
import com.rental.room.entity.*;
import com.rental.room.exception.AppException;
import com.rental.room.repository.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RoomEditAndLockTest {
    private final RoomRepository rooms = mock(RoomRepository.class);
    private final FloorRepository floors = mock(FloorRepository.class);
    private final AmenityRepository amenities = mock(AmenityRepository.class);
    private final RoomServiceImpl service = new RoomServiceImpl(rooms, floors, amenities);
    private final ObjectMapper json = new ObjectMapper().disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
    private final Amenity wifi = Amenity.builder().id(1L).name("WiFi Tốc Độ Cao").build();

    private Room room(RoomStatus status) {
        BoardingHouse house = BoardingHouse.builder().id(10L).name("House").status("ACTIVE").build();
        Building building = Building.builder().id(20L).boardingHouse(house).build();
        Floor floor = Floor.builder().id(30L).building(building).floorNumber(1).build();
        Room room = Room.builder().id(40L).floor(floor).roomNumber("P.101")
                .basePrice(BigDecimal.TEN).area(25.0).status(status).amenities(new HashSet<>(Set.of(wifi))).build();
        when(rooms.findById(40L)).thenReturn(Optional.of(room));
        when(rooms.findLockedById(40L)).thenReturn(Optional.of(room));
        when(rooms.save(any(Room.class))).thenAnswer(call -> call.getArgument(0));
        return room;
    }

    private UpdateRoomRequest edit(String fields) throws Exception {
        return json.readValue("{\"roomNumber\":\"P.101\",\"basePrice\":10,\"area\":25," + fields + "}", UpdateRoomRequest.class);
    }

    @Test void roomListReturnsPreviouslySavedAmenities() {
        Room room = room(RoomStatus.AVAILABLE);
        when(rooms.findByFilter(null, null)).thenReturn(List.of(room));
        assertEquals("WiFi Tốc Độ Cao", json.valueToTree(service.getRooms(null, null)).get(0).path("amenities").path(0).path("name").asText());
    }

    @Test void cannotAddRoomsToAnUnapprovedHouse() {
        Room existing = room(RoomStatus.AVAILABLE);
        existing.getFloor().getBuilding().getBoardingHouse().setStatus("PENDING_APPROVAL");
        when(floors.findById(30L)).thenReturn(Optional.of(existing.getFloor()));
        var request = new CreateRoomRequest();
        request.setFloorId(30L);
        assertThrows(AppException.class, () -> service.createRoom(request));
        verify(rooms, never()).save(any());
    }

    @Test void managedRoomStatesCannotBeClearedByGenericStatusOrDelete() {
        for (RoomStatus status : List.of(RoomStatus.HOLDING, RoomStatus.MAINTENANCE)) {
            Room managed = room(status);
            assertThrows(AppException.class, () -> service.updateRoomStatus(40L, RoomStatus.AVAILABLE));
            assertThrows(AppException.class, () -> service.deleteRoom(40L));
            assertEquals(status, managed.getStatus());
        }
        verify(rooms, never()).delete(any());
    }

    @Test void genericStatusCannotAcquireHoldOrMaintenance() {
        room(RoomStatus.AVAILABLE);
        assertThrows(AppException.class, () -> service.updateRoomStatus(40L, RoomStatus.HOLDING));
        assertThrows(AppException.class, () -> service.updateRoomStatus(40L, RoomStatus.MAINTENANCE));
    }

    @Test void cannotMoveAnExistingRoomIntoAnUnapprovedHouse() throws Exception {
        Room existing = room(RoomStatus.AVAILABLE);
        BoardingHouse pending = BoardingHouse.builder().status("PENDING_APPROVAL").build();
        Floor destination = Floor.builder().id(31L).building(Building.builder().boardingHouse(pending).build()).build();
        when(floors.findById(31L)).thenReturn(Optional.of(destination));
        assertThrows(AppException.class, () -> service.updateRoom(40L, edit("\"floorId\":31")));
        assertEquals(30L, existing.getFloor().getId());
        verify(rooms, never()).save(any());
    }

    @Test void selectedAmenityNamesAreSavedAndReturned() throws Exception {
        Room room = room(RoomStatus.AVAILABLE);
        Amenity balcony = Amenity.builder().id(2L).name("Ban công").build();
        when(amenities.findByName("Ban công")).thenReturn(Optional.of(balcony));
        var response = service.updateRoom(40L, edit("\"amenities\":[\"Ban công\"]"));
        assertEquals(Set.of(balcony), room.getAmenities());
        assertEquals("Ban công", response.getAmenities().get(0).getName());
    }

    @Test void deselectingEveryAmenityClearsTheSavedSelection() throws Exception {
        Room room = room(RoomStatus.AVAILABLE);
        service.updateRoom(40L, edit("\"amenities\":[]"));
        assertTrue(room.getAmenities().isEmpty());
    }

    @Test void omittingAmenitiesPreservesExistingSelection() throws Exception {
        Room room = room(RoomStatus.AVAILABLE);
        service.updateRoom(40L, edit("\"maxOccupants\":3"));
        assertEquals(Set.of(wifi), room.getAmenities());
    }

    @Test void selectedImageSurvivesAnUpdateAndListReload() throws Exception {
        Room room = room(RoomStatus.AVAILABLE);
        service.updateRoom(40L, edit("\"imageUrl\":\"/assets/images/room_duplex_2.jpg\""));
        when(rooms.findByFilter(null, null)).thenReturn(List.of(room));
        assertEquals("/assets/images/room_duplex_2.jpg", json.valueToTree(service.getRooms(null, null)).get(0).path("imageUrl").asText());
    }

    @Test void cannotLockAnOccupiedRoomViaStatusEndpoint() {
        Room room = room(RoomStatus.OCCUPIED);
        var error = assertThrows(AppException.class, () -> service.updateRoomStatus(40L, RoomStatus.MAINTENANCE));
        assertEquals("ROOM_OCCUPIED", error.getErrorCode());
        assertEquals(RoomStatus.OCCUPIED, room.getStatus());
        verify(rooms, never()).save(any());
    }

    @Test void cannotBypassOccupiedGuardThroughTheEditEndpoint() throws Exception {
        Room room = room(RoomStatus.OCCUPIED);
        var request = edit("\"status\":\"MAINTENANCE\"");
        assertThrows(AppException.class, () -> service.updateRoom(40L, request));
        assertEquals(RoomStatus.OCCUPIED, room.getStatus());
        verify(rooms, never()).save(any());
    }

    @Test void vacantRoomCanBeLockedThenUnlockedWithDistinctStatus() {
        room(RoomStatus.AVAILABLE);
        assertEquals("LOCKED", service.updateRoomStatus(40L, RoomStatus.valueOf("LOCKED")).getStatus().name());
        assertEquals(RoomStatus.AVAILABLE, service.updateRoomStatus(40L, RoomStatus.AVAILABLE).getStatus());
    }

    @Test void occupiedRoomCannotBeLockedWithTheNewStatus() {
        room(RoomStatus.OCCUPIED);
        RoomStatus locked = RoomStatus.valueOf("LOCKED");
        assertThrows(AppException.class, () -> service.updateRoomStatus(40L, locked));
    }
}
