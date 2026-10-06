package com.rental.billing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
public class CreateInvoiceRequest {

    @NotNull(message = "Contract ID is required")
    private Long contractId;

    @NotNull(message = "Tenant ID is required")
    private Long tenantId;

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    private Integer month;

    @NotNull(message = "Year is required")
    private Integer year;

    @NotNull(message = "Room fee is required")
    @DecimalMin(value = "0.0", message = "Room fee must be >= 0")
    private BigDecimal roomFee;

    @Builder.Default
    private BigDecimal electricityFee = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal waterFee = BigDecimal.ZERO;

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

    @Valid
    private List<InvoiceItemDto> items;
}
