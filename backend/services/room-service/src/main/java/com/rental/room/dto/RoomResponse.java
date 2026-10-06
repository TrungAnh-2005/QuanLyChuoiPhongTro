package com.rental.room.dto;

import com.rental.room.entity.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private Long id;
    private Long floorId;
    private Integer floorNumber;
    private String buildingName;
    private String boardingHouseName;
    private String roomNumber;
    private BigDecimal basePrice;
    private Double area;
    private Integer maxOccupants;
    private RoomStatus status;
    private LocalDateTime createdAt;
}
