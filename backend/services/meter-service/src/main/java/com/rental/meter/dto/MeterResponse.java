package com.rental.meter.dto;

import com.rental.meter.entity.MeterType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeterResponse {
    private Long id;
    private Long roomId;
    private MeterType meterType;
    private LocalDateTime createdAt;
}
