package com.rental.room.service;

import com.rental.room.dto.BoardingHouseResponse;
import com.rental.room.dto.CreateBoardingHouseRequest;

import java.util.List;

public interface BoardingHouseService {
    BoardingHouseResponse createBoardingHouse(CreateBoardingHouseRequest request);
    List<BoardingHouseResponse> getAllBoardingHouses();
    BoardingHouseResponse getBoardingHouseById(Long id);
    BoardingHouseResponse updateBoardingHouse(Long id, CreateBoardingHouseRequest request);
    void deleteBoardingHouse(Long id);
}
