package com.rental.maintenance.controller;

import com.rental.maintenance.dto.CreateMaintenanceRequest;
import com.rental.maintenance.dto.MaintenanceResponse;
import com.rental.maintenance.dto.UpdateMaintenanceStatusRequest;
import com.rental.maintenance.entity.MaintenancePriority;
import com.rental.maintenance.entity.MaintenanceStatus;
import com.rental.maintenance.service.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @PostMapping
    public ResponseEntity<MaintenanceResponse> createMaintenanceRequest(@Valid @RequestBody CreateMaintenanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceService.createMaintenanceRequest(request));
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceRequests(
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) MaintenanceStatus status,
            @RequestParam(required = false) MaintenancePriority priority) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceRequests(roomId, tenantId, status, priority));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceResponse> getMaintenanceRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceRequestById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MaintenanceResponse> updateMaintenanceStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMaintenanceStatusRequest request) {
        return ResponseEntity.ok(maintenanceService.updateMaintenanceStatus(id, request));
    }
}
