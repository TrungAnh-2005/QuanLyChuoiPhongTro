package com.rental.contract.client;

import com.rental.contract.client.dto.RoomDto;
import com.rental.contract.client.dto.UpdateRoomStatusDto;
import com.rental.contract.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "room-service")
public interface RoomClient {

    @GetMapping("/api/rooms/{id}")
    ApiResponse<RoomDto> getRoomById(@PathVariable("id") Long id);

    @PatchMapping("/api/rooms/{id}/status")
    ApiResponse<RoomDto> updateRoomStatus(@PathVariable("id") Long id, @RequestBody UpdateRoomStatusDto request);
}
