package com.rental.room.controller;

import com.rental.room.dto.ApiResponse;
import com.rental.room.entity.Room;
import com.rental.room.entity.RoomStatus;
import com.rental.room.service.impl.RoomAvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;

// Internal service-to-service operations. Gateway blocks these paths for clients.
@RestController
@RequestMapping("/api/rooms/{id}")
@RequiredArgsConstructor
public class RoomAvailabilityController {
    private final RoomAvailabilityService availability;
    public record Hold(Long requestId, Long tenantId, Instant expiresAt) {}
    public record Tenant(Long tenantId) {}
    public record Ticket(Long ticketId) {}
    public record RoomState(Long id, RoomStatus status, Long holdRequestId, Instant holdExpiresAt, Long maintenanceRequestId) {}
    private ApiResponse<RoomState> response(Room room) {
        return ApiResponse.success(new RoomState(room.getId(), room.getStatus(), room.getHoldRequestId(), room.getHoldExpiresAt(), room.getMaintenanceRequestId()));
    }

    @PostMapping("/holds")
    public ApiResponse<RoomState> hold(@PathVariable Long id, @RequestBody Hold body) {
        return response(availability.hold(id, body.requestId(), body.tenantId(), body.expiresAt()));
    }
    @DeleteMapping("/holds/{requestId}")
    public ApiResponse<RoomState> release(@PathVariable Long id, @PathVariable Long requestId) {
        return response(availability.releaseHold(id, requestId));
    }
    @PostMapping("/holds/{requestId}/confirm")
    public ApiResponse<RoomState> confirm(@PathVariable Long id, @PathVariable Long requestId, @RequestBody Tenant body) {
        return response(availability.confirmHold(id, requestId, body.tenantId()));
    }
    @PostMapping("/maintenance/start")
    public ApiResponse<RoomState> maintenance(@PathVariable Long id, @RequestBody Ticket body) {
        return response(availability.startMaintenance(id, body.ticketId()));
    }
    @PostMapping("/maintenance/finish")
    public ApiResponse<RoomState> finish(@PathVariable Long id, @RequestBody Ticket body) {
        return response(availability.finishMaintenance(id, body.ticketId()));
    }
}
