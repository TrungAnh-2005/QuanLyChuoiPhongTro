package com.rental.property.controller;

import com.rental.property.dto.ApiResponse;
import com.rental.property.dto.BoardingHouseResponse;
import com.rental.property.dto.CreateBoardingHouseRequest;
import com.rental.property.dto.HouseMetricsResponse;
import com.rental.property.service.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    @PostMapping
    public ResponseEntity<ApiResponse<BoardingHouseResponse>> createBoardingHouse(
            @Valid @RequestBody CreateBoardingHouseRequest request
    ) {
        BoardingHouseResponse response = propertyService.createBoardingHouse(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Boarding house created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BoardingHouseResponse>>> getAllBoardingHouses() {
        List<BoardingHouseResponse> response = propertyService.getAllBoardingHouses();
        return ResponseEntity.ok(ApiResponse.success(response, "Get all boarding houses successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BoardingHouseResponse>> getBoardingHouseById(@PathVariable Long id) {
        BoardingHouseResponse response = propertyService.getBoardingHouseById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Get boarding house detail successfully"));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<BoardingHouseResponse>> getBoardingHouseByCode(@PathVariable String code) {
        BoardingHouseResponse response = propertyService.getBoardingHouseByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response, "Get boarding house by code successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BoardingHouseResponse>> updateBoardingHouse(
            @PathVariable Long id,
            @Valid @RequestBody CreateBoardingHouseRequest request
    ) {
        BoardingHouseResponse response = propertyService.updateBoardingHouse(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Boarding house updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBoardingHouse(@PathVariable Long id) {
        propertyService.deleteBoardingHouse(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Boarding house deleted successfully"));
    }

    @GetMapping("/{id}/metrics")
    public ResponseEntity<ApiResponse<HouseMetricsResponse>> getHouseMetrics(@PathVariable Long id) {
        HouseMetricsResponse response = propertyService.getHouseMetrics(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Get house metrics successfully"));
    }
}
