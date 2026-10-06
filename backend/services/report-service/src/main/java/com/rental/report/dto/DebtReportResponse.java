package com.rental.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtReportResponse {
    private BigDecimal totalDebt;
    private long totalUnpaidInvoices;
    private List<DebtReportItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DebtReportItem {
        private Long invoiceId;
        private String invoiceNumber;
        private Long tenantId;
        private Long roomId;
        private BigDecimal amount;
        private LocalDate dueDate;
        private long overdueDays;
    }
}
