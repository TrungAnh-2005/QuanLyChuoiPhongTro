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
public class InvoiceEventDTO implements Serializable {
    private Long invoiceId;
    private String invoiceNumber;
    private Long contractId;
    private Long roomId;
    private Long tenantId;
    private Integer month;
    private Integer year;
    private BigDecimal totalAmount;
    private LocalDate dueDate;
}
