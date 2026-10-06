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
public class MonthlyRevenueItem {
    private Integer month;
    private String monthLabel;
    private BigDecimal revenue;
    private Long transactions;
}
