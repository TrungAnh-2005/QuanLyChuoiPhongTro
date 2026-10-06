package com.rental.billing.dto;

import com.rental.billing.entity.InvoiceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInvoiceStatusRequest {

    @NotNull(message = "Invoice status is required")
    private InvoiceStatus status;
}
