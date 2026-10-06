package com.rental.property.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseMetricsResponse {

    private Long boardingHouseId;
    private String boardingHouseName;
    private int totalRooms;
    private int occupiedRooms;
    private int availableRooms;
    private int maintenanceRooms;
    private double occupancyRate;
}
