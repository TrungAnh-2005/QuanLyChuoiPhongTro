package com.rental.property.client;

import com.rental.property.dto.ApiResponse;
import com.rental.property.dto.RoomSummaryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "ROOM-SERVICE")
public interface RoomClient {

    @GetMapping("/api/rooms")
    ResponseEntity<ApiResponse<List<RoomSummaryResponse>>> getAllRooms();
}
