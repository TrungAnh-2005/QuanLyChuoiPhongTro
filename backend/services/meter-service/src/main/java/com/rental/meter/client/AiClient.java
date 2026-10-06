package com.rental.meter.client;

import com.rental.meter.dto.AiMeterOcrResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "ai-service")
public interface AiClient {

    @PostMapping(value = "/api/ai/ocr/meter", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    AiMeterOcrResponse extractMeterReading(
            @RequestPart("image") MultipartFile image,
            @RequestParam("meterType") String meterType
    );
}
