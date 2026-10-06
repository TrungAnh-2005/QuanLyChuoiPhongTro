package com.rental.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {

    private long totalRooms;
    private long occupiedRooms;
    private long availableRooms;
    private double occupancyRate;
    private BigDecimal currentMonthRevenue;
    private BigDecimal previousMonthRevenue;
    private double revenueGrowthPercentage;
    private long activeContracts;
}
