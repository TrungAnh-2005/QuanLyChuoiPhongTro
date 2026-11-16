package com.rental.room.controller;

import com.rental.room.dto.ApiResponse;
import com.rental.room.entity.BoardingHouse;
import com.rental.room.entity.Building;
import com.rental.room.entity.Floor;
import com.rental.room.entity.HouseServiceConfig;
import com.rental.room.repository.BoardingHouseRepository;
import com.rental.room.repository.BuildingRepository;
import com.rental.room.repository.FloorRepository;
import com.rental.room.repository.HouseServiceConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomStructureController {

    private final HouseServiceConfigRepository serviceConfigRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final BoardingHouseRepository boardingHouseRepository;

    public record ServiceConfigRequest(
            Long boardingHouseId,
            String serviceName,
            String calculationType,
            BigDecimal unitPrice,
            Boolean isActive
    ) {}

    public record BuildingRequest(Long boardingHouseId, String name) {}

    public record BuildingDto(Long id, Long boardingHouseId, String name) {
        static BuildingDto from(Building building) {
            Long houseId = building.getBoardingHouse() != null ? building.getBoardingHouse().getId() : null;
            return new BuildingDto(building.getId(), houseId, building.getName());
        }
    }

    public record FloorRequest(Long buildingId, Integer floorNumber) {}

    public record FloorDto(Long id, Long buildingId, Integer floorNumber) {
        static FloorDto from(Floor floor) {
            Long buildingId = floor.getBuilding() != null ? floor.getBuilding().getId() : null;
            return new FloorDto(floor.getId(), buildingId, floor.getFloorNumber());
        }
    }

    private void requireManager(String roles) {
        if (roles == null || (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Manager role required");
        }
    }

    // --- House Service Configs ---

    @GetMapping("/service-configs")
    public ApiResponse<List<HouseServiceConfig>> listServiceConfigs() {
        return ApiResponse.success(serviceConfigRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));
    }

    @PostMapping("/service-configs")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ApiResponse<HouseServiceConfig> createServiceConfig(
            @RequestBody ServiceConfigRequest req,
            @RequestHeader("X-User-Roles") String roles) {
        requireManager(roles);
        if (req.boardingHouseId() == null || req.serviceName() == null || req.calculationType() == null || req.unitPrice() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required service config fields");
        }
        HouseServiceConfig saved = serviceConfigRepository.save(HouseServiceConfig.builder()
                .boardingHouseId(req.boardingHouseId())
                .serviceName(req.serviceName())
                .calculationType(req.calculationType())
                .unitPrice(req.unitPrice())
                .isActive(req.isActive() != null ? req.isActive() : true)
                .build());
        return ApiResponse.success(saved);
    }

    @PatchMapping("/service-configs/{id}")
    @Transactional
    public ApiResponse<HouseServiceConfig> updateServiceConfig(
            @PathVariable Long id,
            @RequestBody ServiceConfigRequest req,
            @RequestHeader("X-User-Roles") String roles) {
        requireManager(roles);
        HouseServiceConfig existing = serviceConfigRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.boardingHouseId() != null) existing.setBoardingHouseId(req.boardingHouseId());
        if (req.serviceName() != null) existing.setServiceName(req.serviceName());
        if (req.calculationType() != null) existing.setCalculationType(req.calculationType());
        if (req.unitPrice() != null) existing.setUnitPrice(req.unitPrice());
        if (req.isActive() != null) existing.setIsActive(req.isActive());
        return ApiResponse.success(serviceConfigRepository.save(existing));
    }

    @DeleteMapping("/service-configs/{id}")
    @Transactional
    public ApiResponse<Long> deleteServiceConfig(
            @PathVariable Long id,
            @RequestHeader("X-User-Roles") String roles) {
        requireManager(roles);
        if (!serviceConfigRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        serviceConfigRepository.deleteById(id);
        return ApiResponse.success(id);
    }

    // --- Buildings ---

    @GetMapping("/buildings")
    @Transactional(readOnly = true)
    public ApiResponse<List<BuildingDto>> listBuildings() {
        List<BuildingDto> list = buildingRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .map(BuildingDto::from)
                .toList();
        return ApiResponse.success(list);
    }

    @PostMapping("/buildings")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ApiResponse<BuildingDto> createBuilding(
            @RequestBody BuildingRequest req,
            @RequestHeader("X-User-Roles") String roles) {
        requireManager(roles);
        if (req.boardingHouseId() == null || req.name() == null || req.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "boardingHouseId and name are required");
        }
        BoardingHouse house = boardingHouseRepository.findById(req.boardingHouseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Boarding house not found"));
        Building saved = buildingRepository.save(Building.builder()
                .boardingHouse(house)
                .name(req.name())
                .build());
        return ApiResponse.success(BuildingDto.from(saved));
    }

    // --- Floors ---

    @GetMapping("/floors")
    @Transactional(readOnly = true)
    public ApiResponse<List<FloorDto>> listFloors() {
        List<FloorDto> list = floorRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .map(FloorDto::from)
                .toList();
        return ApiResponse.success(list);
    }

    @PostMapping("/floors")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ApiResponse<FloorDto> createFloor(
            @RequestBody FloorRequest req,
            @RequestHeader("X-User-Roles") String roles) {
        requireManager(roles);
        if (req.buildingId() == null || req.floorNumber() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "buildingId and floorNumber are required");
        }
        Building building = buildingRepository.findById(req.buildingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Building not found"));
        Floor saved = floorRepository.save(Floor.builder()
                .building(building)
                .floorNumber(req.floorNumber())
                .build());
        return ApiResponse.success(FloorDto.from(saved));
    }

}

