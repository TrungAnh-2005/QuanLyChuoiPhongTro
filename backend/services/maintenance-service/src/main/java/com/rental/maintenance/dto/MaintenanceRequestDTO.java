package com.rental.maintenance.dto;

import com.rental.maintenance.entity.MaintenancePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import com.fasterxml.jackson.annotation.JsonIgnore;
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

    private Long tenantId;

    @Builder.Default
    private Boolean blocksRental = false;

    @AssertTrue(message = "Tenant ID is required for a nonblocking maintenance request")
    @JsonIgnore
    public boolean isTenantValid() {
        return Boolean.TRUE.equals(blocksRental) || tenantId != null;
    }

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private String imageUrl;

    private MaintenancePriority priority;
}
