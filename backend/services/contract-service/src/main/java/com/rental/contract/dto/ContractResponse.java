package com.rental.contract.dto;

import com.rental.contract.entity.ContractStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractResponse {
    private Long id;
    private String contractCode;
    private Long tenantId;
    private String tenantName;
    private Long roomId;
    private String roomNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal rentalPrice;
    private BigDecimal depositAmount;
    private Integer paymentCycle;
    private String terms;
    private ContractStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
