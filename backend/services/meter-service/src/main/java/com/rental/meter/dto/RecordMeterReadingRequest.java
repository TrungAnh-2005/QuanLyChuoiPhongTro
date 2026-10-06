package com.rental.meter.dto;

import com.rental.meter.entity.MeterType;
import jakarta.validation.constraints.DecimalMin;
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
public class RecordMeterReadingRequest {

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Meter type is required (ELECTRICITY, WATER)")
    private MeterType meterType;

    @NotNull(message = "New reading value is required")
    @DecimalMin(value = "0.0", message = "Reading must be at least 0")
    private Double newReading;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", message = "Unit price must be at least 0")
    private BigDecimal unitPrice;

    private LocalDate readingDate;
}
