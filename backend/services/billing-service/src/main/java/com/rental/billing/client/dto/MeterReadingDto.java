package com.rental.billing.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeterReadingDto {
    private Long id;
    private Long roomId;
    private String meterType;
    private Double oldReading;
    private Double newReading;
    private Double usageAmount;
    private BigDecimal unitPrice;
    private BigDecimal fee;
}
