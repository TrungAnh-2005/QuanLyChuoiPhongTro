package com.rental.billing.dto;

import com.rental.billing.entity.InvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    private String invoiceCode;
    private Long contractId;
    private Long tenantId;
    private Long roomId;
    private Integer month;
    private Integer year;
    private BigDecimal roomFee;
    private BigDecimal electricityFee;
    private BigDecimal waterFee;
    private BigDecimal internetFee;
    private BigDecimal serviceFee;
    private BigDecimal parkingFee;
    private BigDecimal otherFee;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    private InvoiceStatus status;
    private LocalDate dueDate;
    private List<InvoiceItemDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
