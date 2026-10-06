package com.rental.tenant.client;

import com.rental.tenant.dto.IdCardOcrResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "ai-service")
public interface AiClient {

    @PostMapping(value = "/api/ai/ocr/id-card", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    IdCardOcrResponse extractIdCard(
            @RequestPart("front") MultipartFile front,
            @RequestPart(value = "back", required = false) MultipartFile back
    );
}
