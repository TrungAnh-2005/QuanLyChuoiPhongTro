package com.rental.billing.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
public class GenerateMonthlyInvoiceRequest {

    @NotNull(message = "Contract ID is required")
    private Long contractId;

    @NotNull(message = "Month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    private Integer month;

    @NotNull(message = "Year is required")
    @Min(value = 2020, message = "Year must be valid")
    private Integer year;

    @Builder.Default
    private BigDecimal internetFee = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal serviceFee = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal parkingFee = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal otherFee = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    private LocalDate dueDate;
}
