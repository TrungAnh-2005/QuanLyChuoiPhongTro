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
public class InvoiceClientDto {
    private Long id;
    private String invoiceNumber;
    private Long roomId;
    private Long tenantId;
    private Integer month;
    private Integer year;
    private BigDecimal totalAmount;
    private String status;
    private LocalDate dueDate;
}
