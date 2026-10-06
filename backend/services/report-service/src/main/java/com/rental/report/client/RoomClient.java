package com.rental.report.client;

import com.rental.report.client.dto.RoomClientDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "room-service")
public interface RoomClient {

    @GetMapping("/api/rooms")
    List<RoomClientDto> getAllRooms();
}
