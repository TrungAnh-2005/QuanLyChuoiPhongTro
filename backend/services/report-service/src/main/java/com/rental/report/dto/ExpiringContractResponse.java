package com.rental.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringContractResponse {
    private long totalExpiring;
    private List<ExpiringContractItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpiringContractItem {
        private Long contractId;
        private String contractNumber;
        private Long roomId;
        private Long tenantId;
        private LocalDate endDate;
        private long remainingDays;
    }
}
