package com.rental.property.dto;

import com.rental.property.entity.HouseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardingHouseResponse {

    private Long id;
    private String code;
    private String name;
    private String address;
    private String ward;
    private String district;
    private String city;
    private String managerName;
    private String managerPhone;
    private Integer totalFloors;
    private Integer totalRooms;
    private String description;
    private HouseStatus status;
    private List<String> facilities;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
