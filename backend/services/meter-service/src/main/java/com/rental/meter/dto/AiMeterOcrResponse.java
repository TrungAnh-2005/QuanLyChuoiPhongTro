package com.rental.meter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMeterOcrResponse {
    private String meterType;
    private Double readingValue;
    private Double confidenceScore;
    private Boolean isClear;
    private String notes;
}
