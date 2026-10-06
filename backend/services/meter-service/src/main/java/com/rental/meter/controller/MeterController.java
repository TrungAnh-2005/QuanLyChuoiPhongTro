package com.rental.meter.controller;

import com.rental.meter.dto.*;
import com.rental.meter.entity.MeterType;
import com.rental.meter.service.MeterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meters")
@RequiredArgsConstructor
public class MeterController {

    private final MeterService meterService;

    @PostMapping
    public ResponseEntity<ApiResponse<MeterResponse>> createMeter(@Valid @RequestBody CreateMeterRequest request) {
        MeterResponse response = meterService.createMeter(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Meter created successfully"));
    }

    @PostMapping("/readings")
    public ResponseEntity<ApiResponse<MeterReadingResponse>> recordReading(@Valid @RequestBody RecordMeterReadingRequest request) {
        MeterReadingResponse response = meterService.recordReading(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Meter reading recorded successfully"));
    }

    @PostMapping(value = "/readings/ai-scan", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MeterSmartReadingResponse>> aiScanReading(
            @RequestParam("roomId") Long roomId,
            @RequestParam("meterType") MeterType meterType,
            @RequestPart("image") org.springframework.web.multipart.MultipartFile image,
            @RequestParam(value = "unitPrice", required = false) java.math.BigDecimal unitPrice
    ) {
        MeterSmartReadingRequest request = MeterSmartReadingRequest.builder()
                .roomId(roomId)
                .meterType(meterType)
                .image(image)
                .unitPrice(unitPrice)
                .build();
        MeterSmartReadingResponse response = meterService.scanAndCalculateReading(request);
        return ResponseEntity.ok(ApiResponse.success(response, "AI scanned meter reading successfully"));
    }

    @GetMapping("/rooms/{roomId}/latest")
    public ResponseEntity<ApiResponse<MeterReadingResponse>> getLatestReading(
            @PathVariable Long roomId,
            @RequestParam MeterType meterType
    ) {
        MeterReadingResponse response = meterService.getLatestReading(roomId, meterType);
        return ResponseEntity.ok(ApiResponse.success(response, "Get latest meter reading successfully"));
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ApiResponse<List<MeterReadingResponse>>> getReadingsByRoom(@PathVariable Long roomId) {
        List<MeterReadingResponse> response = meterService.getReadingsByRoom(roomId);
        return ResponseEntity.ok(ApiResponse.success(response, "Get meter readings successfully"));
    }

    @GetMapping("/rooms/{roomId}/devices")
    public ResponseEntity<ApiResponse<List<MeterResponse>>> getMetersByRoom(@PathVariable Long roomId) {
        List<MeterResponse> response = meterService.getMetersByRoom(roomId);
        return ResponseEntity.ok(ApiResponse.success(response, "Get meters successfully"));
    }
}
