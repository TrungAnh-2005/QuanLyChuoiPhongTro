package com.rental.room.controller;

import com.rental.room.dto.ApiResponse;
import com.rental.room.dto.BoardingHouseResponse;
import com.rental.room.dto.CreateBoardingHouseRequest;
import com.rental.room.service.BoardingHouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/boarding-houses", "/api/properties"})
@RequiredArgsConstructor
public class BoardingHouseController {

    private final BoardingHouseService boardingHouseService;

    @PostMapping
    public ResponseEntity<ApiResponse<BoardingHouseResponse>> createBoardingHouse(
            @Valid @RequestBody CreateBoardingHouseRequest request
    ) {
        BoardingHouseResponse response = boardingHouseService.createBoardingHouse(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Boarding house created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BoardingHouseResponse>>> getAllBoardingHouses() {
        List<BoardingHouseResponse> response = boardingHouseService.getAllBoardingHouses();
        return ResponseEntity.ok(ApiResponse.success(response, "Get all boarding houses successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BoardingHouseResponse>> getBoardingHouseById(@PathVariable Long id) {
        BoardingHouseResponse response = boardingHouseService.getBoardingHouseById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Get boarding house detail successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BoardingHouseResponse>> updateBoardingHouse(
            @PathVariable Long id,
            @Valid @RequestBody CreateBoardingHouseRequest request
    ) {
        BoardingHouseResponse response = boardingHouseService.updateBoardingHouse(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Boarding house updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBoardingHouse(@PathVariable Long id) {
        boardingHouseService.deleteBoardingHouse(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Boarding house deleted successfully"));
    }
}

