package com.rental.maintenance.dto;

import com.rental.maintenance.entity.MaintenancePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRequestDTO {

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Tenant ID is required")
    private Long tenantId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private String imageUrl;

    private MaintenancePriority priority;
}
