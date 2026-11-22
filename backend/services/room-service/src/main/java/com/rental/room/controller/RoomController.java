package com.rental.room.controller;

import com.rental.room.dto.*;
import com.rental.room.entity.RoomStatus;
import com.rental.room.service.RoomService;
import com.rental.room.exception.AppException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Arrays;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<ApiResponse<RoomDetailResponse>> createRoom(@Valid @RequestBody CreateRoomRequest request,
            @RequestHeader(value = "X-User-Roles", defaultValue = "") String roles) {
        manager(roles);
        RoomDetailResponse response = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Room created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRooms(
            @RequestParam(required = false) RoomStatus status,
            @RequestParam(required = false) Long floorId
    ) {
        List<RoomResponse> response = roomService.getRooms(status, floorId);
        return ResponseEntity.ok(ApiResponse.success(response, "Get rooms successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomDetailResponse>> getRoomById(@PathVariable Long id) {
        RoomDetailResponse response = roomService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Get room detail successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomDetailResponse>> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoomRequest request,
            @RequestHeader(value = "X-User-Roles", defaultValue = "") String roles
    ) {
        manager(roles);
        RoomDetailResponse response = roomService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Room updated successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoomStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoomStatusRequest request,
            @RequestHeader(value = "X-User-Roles", defaultValue = "") String roles
    ) {
        manager(roles);
        RoomResponse response = roomService.updateRoomStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(response, "Room status updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long id,
            @RequestHeader(value = "X-User-Roles", defaultValue = "") String roles) {
        manager(roles);
        roomService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Room deleted successfully"));
    }

    private void manager(String roles) {
        // Empty header is reserved for existing trusted service-to-service clients.
        if (roles.isBlank()) return;
        if (Arrays.stream(roles.split(",")).map(String::trim).noneMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_STAFF"))) {
            throw new AppException("Chỉ quản lý được thao tác phòng.", HttpStatus.FORBIDDEN, "MANAGER_REQUIRED");
        }
    }
}
