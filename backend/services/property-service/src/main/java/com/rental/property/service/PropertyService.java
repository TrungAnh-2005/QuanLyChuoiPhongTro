package com.rental.property.service;

import com.rental.property.dto.BoardingHouseResponse;
import com.rental.property.dto.CreateBoardingHouseRequest;
import com.rental.property.dto.HouseMetricsResponse;

import java.util.List;

public interface PropertyService {

    BoardingHouseResponse createBoardingHouse(CreateBoardingHouseRequest request);

    List<BoardingHouseResponse> getAllBoardingHouses();

    BoardingHouseResponse getBoardingHouseById(Long id);

    BoardingHouseResponse getBoardingHouseByCode(String code);

    BoardingHouseResponse updateBoardingHouse(Long id, CreateBoardingHouseRequest request);

    void deleteBoardingHouse(Long id);

    HouseMetricsResponse getHouseMetrics(Long id);
}
