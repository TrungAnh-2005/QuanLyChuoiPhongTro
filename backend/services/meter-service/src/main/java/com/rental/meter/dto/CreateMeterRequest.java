package com.rental.meter.dto;

import com.rental.meter.entity.MeterType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMeterRequest {

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Meter type is required (ELECTRICITY, WATER)")
    private MeterType meterType;
}
