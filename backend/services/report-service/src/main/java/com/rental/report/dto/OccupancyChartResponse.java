package com.rental.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyChartResponse {
    private long totalRooms;
    private long occupiedRooms;
    private long availableRooms;
    private long maintenanceRooms;
    private double occupancyRate;
}
