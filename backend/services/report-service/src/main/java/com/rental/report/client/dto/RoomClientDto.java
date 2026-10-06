package com.rental.report.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomClientDto {
    private Long id;
    private String roomNumber;
    private String status;
    private BigDecimal basePrice;
}
