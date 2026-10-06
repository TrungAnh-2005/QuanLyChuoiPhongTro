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
}
