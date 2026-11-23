package com.rental.tenant.controller;

import com.rental.tenant.dto.*;
import com.rental.tenant.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

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
