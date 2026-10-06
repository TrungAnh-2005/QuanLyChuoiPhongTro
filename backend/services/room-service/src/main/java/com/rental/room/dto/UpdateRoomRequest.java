package com.rental.room.dto;

import com.rental.room.entity.RoomStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoomRequest {

    private Long floorId;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Base price must be greater than 0")
    private BigDecimal basePrice;

    @NotNull(message = "Area is required")
    @DecimalMin(value = "1.0", message = "Area must be at least 1 square meter")
    private Double area;

    @Min(value = 1, message = "Max occupants must be at least 1")
    @Builder.Default
    private Integer maxOccupants = 2;

    private RoomStatus status;

    private Set<Long> amenityIds;
}
