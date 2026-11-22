package com.rental.maintenance.repository;

import com.rental.maintenance.entity.MaintenancePriority;
import com.rental.maintenance.entity.MaintenanceRequest;
import com.rental.maintenance.entity.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceRepository extends JpaRepository<MaintenanceRequest, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ticket from MaintenanceRequest ticket where ticket.id = :id")
    Optional<MaintenanceRequest> findByIdForUpdate(@Param("id") Long id);
    List<MaintenanceRequest> findByRoomId(Long roomId);
    List<MaintenanceRequest> findByTenantId(Long tenantId);
    List<MaintenanceRequest> findByStatus(MaintenanceStatus status);
    List<MaintenanceRequest> findByPriority(MaintenancePriority priority);
}
