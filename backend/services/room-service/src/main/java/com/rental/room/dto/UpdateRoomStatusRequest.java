package com.rental.room.dto;

import com.rental.room.entity.RoomStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoomStatusRequest {

    @NotNull(message = "Room status is required")
    private RoomStatus status;
}
