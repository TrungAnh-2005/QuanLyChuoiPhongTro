package com.rental.contract.client;

import com.rental.contract.client.dto.RoomDto;
import com.rental.contract.client.dto.UpdateRoomStatusDto;
import com.rental.contract.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import java.time.Instant;

@FeignClient(name = "room-service")
public interface RoomClient {

    @GetMapping("/api/rooms/{id}")
    ApiResponse<RoomDto> getRoomById(@PathVariable("id") Long id);

    @PatchMapping("/api/rooms/{id}/status")
    ApiResponse<RoomDto> updateRoomStatus(@PathVariable("id") Long id, @RequestBody UpdateRoomStatusDto request);

    record HoldRequest(Long requestId, Long tenantId, Instant expiresAt) {}
    record ConfirmHoldRequest(Long tenantId) {}

    @PostMapping("/api/rooms/{id}/holds")
    ApiResponse<RoomDto> acquireHold(@PathVariable("id") Long id, @RequestBody HoldRequest request);

    @DeleteMapping("/api/rooms/{id}/holds/{requestId}")
    ApiResponse<RoomDto> releaseHold(@PathVariable("id") Long id, @PathVariable("requestId") Long requestId);

    @PostMapping("/api/rooms/{id}/holds/{requestId}/confirm")
    ApiResponse<RoomDto> confirmHold(@PathVariable("id") Long id, @PathVariable("requestId") Long requestId,
                                  @RequestBody ConfirmHoldRequest request);
}
