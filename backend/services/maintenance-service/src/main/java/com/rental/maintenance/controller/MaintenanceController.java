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
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Arrays;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @PostMapping
    public ResponseEntity<MaintenanceResponse> createMaintenanceRequest(
            @Valid @RequestBody CreateMaintenanceRequest request,
            @RequestHeader(value = "X-User-Roles", required = false) String roles) {
        if (Boolean.TRUE.equals(request.getBlocksRental())) {
            requireManager(roles);
        }
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

    @PutMapping("/{id}/status")
    public ResponseEntity<MaintenanceResponse> updateMaintenanceStatus(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Roles", required = false) String roles,
            @Valid @RequestBody UpdateMaintenanceStatusRequest request) {
        requireManager(roles);
        return ResponseEntity.ok(maintenanceService.updateMaintenanceStatus(id, request));
    }

    private void requireManager(String roles) {
        boolean manager = roles != null && Arrays.stream(roles.split(","))
                .map(String::trim)
                .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_STAFF"));
        if (!manager) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Staff or Admin may manage maintenance tickets");
        }
    }
}
