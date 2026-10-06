package com.rental.property.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateBoardingHouseRequest {

    @NotBlank(message = "House code cannot be blank")
    @Size(max = 20, message = "House code must not exceed 20 characters")
    private String code;

    @NotBlank(message = "House name cannot be blank")
    @Size(max = 150, message = "House name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "Address cannot be blank")
    private String address;

    private String ward;
    private String district;
    private String city;

    private String managerName;
    private String managerPhone;

    private Integer totalFloors = 1;
    private Integer totalRooms = 0;
    private String description;

    private List<String> facilities;
}
