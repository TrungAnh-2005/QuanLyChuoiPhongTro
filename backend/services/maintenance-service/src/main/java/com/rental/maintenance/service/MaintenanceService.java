package com.rental.maintenance.service;

import com.rental.maintenance.dto.CreateMaintenanceRequest;
import com.rental.maintenance.dto.MaintenanceResponse;
import com.rental.maintenance.dto.UpdateMaintenanceStatusRequest;
import com.rental.maintenance.entity.MaintenancePriority;
import com.rental.maintenance.entity.MaintenanceStatus;

import java.util.List;

public interface MaintenanceService {
    MaintenanceResponse createMaintenanceRequest(CreateMaintenanceRequest request);
    List<MaintenanceResponse> getMaintenanceRequests(Long roomId, Long tenantId, MaintenanceStatus status, MaintenancePriority priority);
    MaintenanceResponse getMaintenanceRequestById(Long id);
    MaintenanceResponse updateMaintenanceStatus(Long id, UpdateMaintenanceStatusRequest request);
}
