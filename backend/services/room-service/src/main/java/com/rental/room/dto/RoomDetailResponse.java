package com.rental.room.dto;

import com.rental.room.entity.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomDetailResponse {
    private Long id;
    private Long floorId;
    private Integer floorNumber;
    private Long buildingId;
    private String buildingName;
    private Long boardingHouseId;
    private String boardingHouseName;
    private String roomNumber;
    private BigDecimal basePrice;
    private Double area;
    private Integer maxOccupants;
    private RoomStatus status;
    private List<AmenityDto> amenities;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
