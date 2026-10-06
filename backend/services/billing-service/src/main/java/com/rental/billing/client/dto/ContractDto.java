package com.rental.billing.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractDto {
    private Long id;
    private String contractCode;
    private Long tenantId;
    private String tenantName;
    private Long roomId;
    private String roomNumber;
    private BigDecimal rentalPrice;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
}
