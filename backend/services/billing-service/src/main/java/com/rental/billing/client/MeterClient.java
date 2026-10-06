package com.rental.billing.client;

import com.rental.billing.client.dto.MeterReadingDto;
import com.rental.billing.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "meter-service")
public interface MeterClient {

    @GetMapping("/api/meters/rooms/{roomId}/latest")
    ApiResponse<MeterReadingDto> getLatestReading(
            @PathVariable("roomId") Long roomId,
            @RequestParam("meterType") String meterType
    );
}
