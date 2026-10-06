package com.rental.maintenance.dto;

import com.rental.maintenance.entity.MaintenancePriority;
import com.rental.maintenance.entity.MaintenanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceResponse {

    private Long id;
    private Long roomId;
    private Long tenantId;
    private String title;
    private String description;
    private String imageUrl;
    private MaintenancePriority priority;
    private MaintenanceStatus status;
    private BigDecimal cost;
    private String assignedTo;
    private String note;
    private LocalDateTime requestedDate;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
