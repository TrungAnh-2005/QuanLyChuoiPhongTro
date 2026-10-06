package com.rental.meter.dto;

import com.rental.meter.entity.MeterType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeterSmartReadingRequest {

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Meter type is required (ELECTRICITY, WATER)")
    private MeterType meterType;

    @NotNull(message = "Meter image is required")
    private MultipartFile image;

    private BigDecimal unitPrice;
}
