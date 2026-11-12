package com.rental.room.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBoardingHouseRequest {

    @NotBlank(message = "Boarding house name is required")
    private String name;

    @NotBlank(message = "Address is required")
    private String address;

    private String managerPhone;

    private Long ownerId;
    private String code;
    private String managerName;
    private String managerUsername;
    private String createdBy;
    private String status;
    private String imageUrl;
    private Integer totalFloors;
    private Integer totalRooms;
}
