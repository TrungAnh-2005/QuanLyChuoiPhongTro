package com.rental.room.service;

import com.rental.room.dto.*;
import com.rental.room.entity.RoomStatus;

import java.util.List;

public interface RoomService {
    RoomDetailResponse createRoom(CreateRoomRequest request);
    List<RoomResponse> getRooms(RoomStatus status, Long floorId);
    RoomDetailResponse getRoomById(Long id);
    RoomDetailResponse updateRoom(Long id, UpdateRoomRequest request);
    RoomResponse updateRoomStatus(Long id, RoomStatus status);
    void deleteRoom(Long id);
}
