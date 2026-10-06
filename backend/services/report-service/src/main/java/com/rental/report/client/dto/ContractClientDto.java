package com.rental.report.client.dto;

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
public class ContractClientDto {
    private Long id;
    private String contractNumber;
    private Long roomId;
    private Long tenantId;
    private String status;
    private BigDecimal monthlyRent;
    private LocalDate startDate;
    private LocalDate endDate;
}
