package com.rental.ai.controller;

import com.rental.ai.dto.IdCardOcrResponse;
import com.rental.ai.dto.MeterOcrResponse;
import com.rental.ai.service.AiVisionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Vision & OCR", description = "Endpoints OCR Căn cước công dân và Đồng hồ điện nước")
public class AiController {

    private final AiVisionService aiVisionService;

    @PostMapping(value = {"/ocr/id-card", "/id-card-ocr"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "OCR Căn Cước Công Dân (CCCD)", description = "Trích xuất họ tên, số CCCD, ngày sinh, quê quán, nơi thường trú từ ảnh mặt trước và mặt sau")
    public ResponseEntity<IdCardOcrResponse> extractIdCard(
            @RequestPart("front") MultipartFile front,
            @RequestPart(value = "back", required = false) MultipartFile back
    ) {
        IdCardOcrResponse response = aiVisionService.extractIdCard(front, back);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/ocr/meter", "/meter-ocr"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "OCR Đồng Hồ Công Tơ Điện / Nước", description = "Nhận diện và trích xuất chỉ số đồng hồ điện / nước từ ảnh chụp")
    public ResponseEntity<MeterOcrResponse> extractMeterReading(
            @RequestPart("image") MultipartFile image,
            @RequestParam(value = "meterType", defaultValue = "ELECTRICITY") String meterType
    ) {
        MeterOcrResponse response = aiVisionService.extractMeterReading(image, meterType);
        return ResponseEntity.ok(response);
    }
}

