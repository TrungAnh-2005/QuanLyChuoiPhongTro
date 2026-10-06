package com.rental.maintenance.dto;

import com.rental.maintenance.entity.MaintenanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMaintenanceStatusRequest {

    @NotNull(message = "Maintenance status is required")
    private MaintenanceStatus status;

    private BigDecimal cost;

    private String assignedTo;

    private String note;
}
