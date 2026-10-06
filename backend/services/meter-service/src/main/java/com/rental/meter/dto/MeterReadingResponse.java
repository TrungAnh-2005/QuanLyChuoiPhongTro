package com.rental.meter.dto;

import com.rental.meter.entity.MeterType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeterReadingResponse {
    private Long id;
    private Long meterId;
    private Long roomId;
    private MeterType meterType;
    private Double oldReading;
    private Double newReading;
    private LocalDate readingDate;
    private BigDecimal unitPrice;
    private Double usageAmount;
    private BigDecimal fee;
    private LocalDateTime createdAt;
}
