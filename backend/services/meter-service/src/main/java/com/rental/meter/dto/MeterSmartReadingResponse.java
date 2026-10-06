package com.rental.meter.dto;

import com.rental.meter.entity.MeterType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeterSmartReadingResponse {

    private Long roomId;
    private MeterType meterType;
    private Double oldReading;
    private Double newReading;
    private Double usageAmount;
    private BigDecimal unitPrice;
    private BigDecimal fee;
    private Boolean isAbnormal;
    private String warningMessage;
    private Double confidenceScore;
}
