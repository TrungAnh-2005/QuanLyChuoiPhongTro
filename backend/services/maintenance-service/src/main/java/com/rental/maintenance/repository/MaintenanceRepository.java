package com.rental.maintenance.repository;

import com.rental.maintenance.entity.MaintenancePriority;
import com.rental.maintenance.entity.MaintenanceRequest;
import com.rental.maintenance.entity.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<MaintenanceRequest, Long> {
    List<MaintenanceRequest> findByRoomId(Long roomId);
    List<MaintenanceRequest> findByTenantId(Long tenantId);
    List<MaintenanceRequest> findByStatus(MaintenanceStatus status);
    List<MaintenanceRequest> findByPriority(MaintenancePriority priority);
}
