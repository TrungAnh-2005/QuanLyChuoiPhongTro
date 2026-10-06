package com.rental.contract.dto;

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
public class RenewContractRequest {

    @NotNull(message = "New end date is required")
    private LocalDate newEndDate;

    private BigDecimal newRentalPrice;
}
