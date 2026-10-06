package com.rental.room.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardingHouseResponse {
    private Long id;
    private String name;
    private String address;
    private String managerPhone;
    private int totalBuildings;
    private LocalDateTime createdAt;
}
