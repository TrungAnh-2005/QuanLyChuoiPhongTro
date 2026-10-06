package com.rental.room.service.impl;

import com.rental.room.dto.BoardingHouseResponse;
import com.rental.room.dto.CreateBoardingHouseRequest;
import com.rental.room.entity.BoardingHouse;
import com.rental.room.entity.Building;
import com.rental.room.entity.Floor;
import com.rental.room.exception.AppException;
import com.rental.room.repository.BoardingHouseRepository;
import com.rental.room.service.BoardingHouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardingHouseServiceImpl implements BoardingHouseService {

    private final BoardingHouseRepository boardingHouseRepository;

    @Override
    @Transactional
    public BoardingHouseResponse createBoardingHouse(CreateBoardingHouseRequest request) {
        BoardingHouse boardingHouse = BoardingHouse.builder()
                .name(request.getName().trim())
                .address(request.getAddress().trim())
                .managerPhone(request.getManagerPhone() != null ? request.getManagerPhone().trim() : null)
                .buildings(new ArrayList<>())
                .build();

        Building defaultBuilding = Building.builder()
                .boardingHouse(boardingHouse)
                .name("Tòa A")
                .floors(new ArrayList<>())
                .build();

        Floor defaultFloor1 = Floor.builder()
                .building(defaultBuilding)
                .floorNumber(1)
                .rooms(new ArrayList<>())
                .build();

        defaultBuilding.getFloors().add(defaultFloor1);
        boardingHouse.getBuildings().add(defaultBuilding);

        BoardingHouse saved = boardingHouseRepository.save(boardingHouse);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BoardingHouseResponse> getAllBoardingHouses() {
        return boardingHouseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BoardingHouseResponse getBoardingHouseById(Long id) {
        BoardingHouse boardingHouse = boardingHouseRepository.findById(id)
                .orElseThrow(() -> new AppException("Boarding house not found with id: " + id, HttpStatus.NOT_FOUND, "BOARDING_HOUSE_NOT_FOUND"));

        return mapToResponse(boardingHouse);
    }

    @Override
    @Transactional
    public BoardingHouseResponse updateBoardingHouse(Long id, CreateBoardingHouseRequest request) {
        BoardingHouse boardingHouse = boardingHouseRepository.findById(id)
                .orElseThrow(() -> new AppException("Boarding house not found with id: " + id, HttpStatus.NOT_FOUND, "BOARDING_HOUSE_NOT_FOUND"));

        boardingHouse.setName(request.getName().trim());
        boardingHouse.setAddress(request.getAddress().trim());
        boardingHouse.setManagerPhone(request.getManagerPhone() != null ? request.getManagerPhone().trim() : null);

        BoardingHouse updated = boardingHouseRepository.save(boardingHouse);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBoardingHouse(Long id) {
        BoardingHouse boardingHouse = boardingHouseRepository.findById(id)
                .orElseThrow(() -> new AppException("Boarding house not found with id: " + id, HttpStatus.NOT_FOUND, "BOARDING_HOUSE_NOT_FOUND"));

        boardingHouseRepository.delete(boardingHouse);
    }

    private BoardingHouseResponse mapToResponse(BoardingHouse entity) {
        return BoardingHouseResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .address(entity.getAddress())
                .managerPhone(entity.getManagerPhone())
                .totalBuildings(entity.getBuildings() != null ? entity.getBuildings().size() : 0)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
