package com.rental.notification.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractEventDTO implements Serializable {
    private Long contractId;
    private String contractNumber;
    private Long roomId;
    private Long tenantId;
    private BigDecimal monthlyRent;
    private BigDecimal depositAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
}
