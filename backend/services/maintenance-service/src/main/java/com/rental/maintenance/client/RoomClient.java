package com.rental.maintenance.client;

import com.rental.maintenance.dto.RoomMaintenanceRequest;
import com.rental.maintenance.dto.RoomLookupResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "room-service")
public interface RoomClient {
    @GetMapping("/api/rooms/{id}")
    RoomLookupResponse getRoom(@PathVariable("id") Long roomId);

    @PostMapping("/api/rooms/{id}/maintenance/start")
    void startMaintenance(@PathVariable("id") Long roomId, @RequestBody RoomMaintenanceRequest request);

    @PostMapping("/api/rooms/{id}/maintenance/finish")
    void finishMaintenance(@PathVariable("id") Long roomId, @RequestBody RoomMaintenanceRequest request);
}
