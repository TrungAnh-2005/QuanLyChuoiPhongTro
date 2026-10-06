package com.rental.contract.dto;

import jakarta.validation.constraints.DecimalMin;
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
public class CreateContractRequest {

    @NotNull(message = "Tenant ID is required")
    private Long tenantId;

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Rental price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Rental price must be greater than 0")
    private BigDecimal rentalPrice;

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "0.0", message = "Deposit amount must be at least 0")
    private BigDecimal depositAmount;

    @Min(value = 1, message = "Payment cycle must be at least 1 month")
    @Builder.Default
    private Integer paymentCycle = 1;

    private String terms;
}
