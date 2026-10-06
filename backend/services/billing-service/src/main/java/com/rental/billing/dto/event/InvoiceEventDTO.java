package com.rental.billing.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceEventDTO implements Serializable {
    private Long invoiceId;
    private String invoiceCode;
    private Long contractId;
    private Long tenantId;
    private Long roomId;
    private Integer month;
    private Integer year;
    private BigDecimal totalAmount;
    private String status;
}
