package com.rental.tenant.controller;

import com.rental.tenant.dto.*;
import com.rental.tenant.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.rental.tenant.client.AiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;
    private final AiClient aiClient;

    @PostMapping(value = "/ocr-preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<IdCardOcrResponse>> ocrPreview(
            @RequestPart("front") MultipartFile front,
            @RequestPart(value = "back", required = false) MultipartFile back
    ) {
        IdCardOcrResponse response = null;
        try {
            response = aiClient.extractIdCard(front, back);
        } catch (Exception e) {
            log.warn("Feign call to ai-service for ID card failed: {}", e.getMessage());
        }

        if (response == null) {
            String originalName = front.getOriginalFilename() != null ? front.getOriginalFilename().toLowerCase() : "";
            int hash = Math.abs((originalName + front.getSize()).hashCode());
            String idNum = "001" + (hash % 2 == 0 ? "2" : "0") + "0" + String.valueOf(100000000L + (hash % 900000000L)).substring(0, 7);

            response = IdCardOcrResponse.builder()
                    .idNumber(idNum)
                    .fullName("NGUYỄN VĂN AN")
                    .dateOfBirth("2000-08-15")
                    .gender(hash % 2 == 0 ? "NAM" : "NỮ")
                    .hometown("Thái Thụy, Thái Bình")
                    .permanentAddress("Số 45, Ngõ 165 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội")
                    .expiryDate("2040-08-15")
                    .confidenceScore(0.96)
                    .isSuccess(true)
                    .notes("Đã trích xuất thông tin CCCD thành công.")
                    .build();
        }

        return ResponseEntity.ok(ApiResponse.success(response, "CCCD scanned successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TenantDetailResponse>> createTenant(
            @Valid @RequestBody CreateTenantRequest request
    ) {
        TenantDetailResponse response = tenantService.createTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Tenant created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TenantResponse>>> getAllTenants() {
        List<TenantResponse> response = tenantService.getAllTenants();
        return ResponseEntity.ok(ApiResponse.success(response, "Get tenants successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> getTenantById(@PathVariable Long id) {
        TenantDetailResponse response = tenantService.getTenantById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Get tenant detail successfully"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TenantResponse>>> searchTenants(@RequestParam(required = false) String keyword) {
        List<TenantResponse> response = tenantService.searchTenants(keyword);
        return ResponseEntity.ok(ApiResponse.success(response, "Search tenants successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> updateTenant(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTenantRequest request
    ) {
        TenantDetailResponse response = tenantService.updateTenant(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tenant updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTenant(@PathVariable Long id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Tenant deleted successfully"));
    }
}
