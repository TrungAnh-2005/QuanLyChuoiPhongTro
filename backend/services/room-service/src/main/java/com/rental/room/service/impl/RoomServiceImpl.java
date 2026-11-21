package com.rental.room.service.impl;

import com.rental.room.dto.*;
import com.rental.room.entity.*;
import com.rental.room.exception.AppException;
import com.rental.room.repository.AmenityRepository;
import com.rental.room.repository.FloorRepository;
import com.rental.room.repository.RoomRepository;
import com.rental.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final FloorRepository floorRepository;
    private final AmenityRepository amenityRepository;

    @Override
    @Transactional
    public RoomDetailResponse createRoom(CreateRoomRequest request) {
        Floor floor = floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new AppException("Floor not found with id: " + request.getFloorId(), HttpStatus.NOT_FOUND, "FLOOR_NOT_FOUND"));

        Set<Amenity> amenities = resolveAmenities(request.getAmenityIds(), request.getAmenities());

        Room room = Room.builder()
                .floor(floor)
                .roomNumber(request.getRoomNumber().trim())
                .basePrice(request.getBasePrice())
                .area(request.getArea())
                .imageUrl(request.getImageUrl())
                .maxOccupants(request.getMaxOccupants() != null ? request.getMaxOccupants() : 2)
                .status(RoomStatus.AVAILABLE)
                .amenities(amenities)
                .build();

        Room saved = roomRepository.save(room);
        return mapToDetailResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponse> getRooms(RoomStatus status, Long floorId) {
        List<Room> rooms = roomRepository.findByFilter(status, floorId);
        return rooms.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RoomDetailResponse getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Room not found with id: " + id, HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND"));

        return mapToDetailResponse(room);
    }

    @Override
    @Transactional
    public RoomDetailResponse updateRoom(Long id, UpdateRoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Room not found with id: " + id, HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND"));

        validateStatusChange(room, request.getStatus());
        if (request.getFloorId() != null && !request.getFloorId().equals(room.getFloor().getId())) {
            Floor floor = floorRepository.findById(request.getFloorId())
                    .orElseThrow(() -> new AppException("Floor not found with id: " + request.getFloorId(), HttpStatus.NOT_FOUND, "FLOOR_NOT_FOUND"));
            room.setFloor(floor);
        }

        room.setRoomNumber(request.getRoomNumber().trim());
        room.setBasePrice(request.getBasePrice());
        room.setArea(request.getArea());
        if (request.getImageUrl() != null) room.setImageUrl(request.getImageUrl());
        if (request.getMaxOccupants() != null) {
            room.setMaxOccupants(request.getMaxOccupants());
        }
        if (request.getStatus() != null) {
            room.setStatus(request.getStatus());
        }

        if (request.getAmenityIds() != null || request.getAmenities() != null) {
            room.setAmenities(resolveAmenities(request.getAmenityIds(), request.getAmenities()));
        }

        Room updated = roomRepository.save(room);
        return mapToDetailResponse(updated);
    }

    @Override
    @Transactional
    public RoomResponse updateRoomStatus(Long id, RoomStatus status) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Room not found with id: " + id, HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND"));

        validateStatusChange(room, status);
        room.setStatus(status);
        Room updated = roomRepository.save(room);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteRoom(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new AppException("Room not found with id: " + id, HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND"));

        if (room.getStatus() == RoomStatus.OCCUPIED) {
            throw new AppException("Phòng còn người thuê. Vui lòng trả phòng trước khi xóa.", HttpStatus.CONFLICT, "ROOM_OCCUPIED");
        }

        roomRepository.delete(room);
    }

    private void validateStatusChange(Room room, RoomStatus status) {
        if (room.getStatus() == RoomStatus.OCCUPIED
                && (status == RoomStatus.LOCKED || status == RoomStatus.MAINTENANCE)) {
            throw new AppException("Phòng còn người thuê. Vui lòng trả phòng trước khi khóa.", HttpStatus.CONFLICT, "ROOM_OCCUPIED");
        }
    }

    private Set<Amenity> resolveAmenities(Set<Long> ids, Set<String> names) {
        if (names == null) return ids == null ? new HashSet<>() : new HashSet<>(amenityRepository.findAllById(ids));
        Set<Amenity> selected = new HashSet<>();
        for (String value : names) {
            if (value == null || value.isBlank() || value.trim().length() > 100) {
                throw new AppException("Tên tiện ích phải có từ 1 đến 100 ký tự.", HttpStatus.BAD_REQUEST, "INVALID_AMENITY");
            }
            String name = value.trim();
            selected.add(amenityRepository.findByName(name)
                    .orElseGet(() -> amenityRepository.save(Amenity.builder().name(name).build())));
        }
        return selected;
    }

    private List<AmenityDto> mapAmenities(Room room) {
        return room.getAmenities().stream().map(a -> AmenityDto.builder()
                .id(a.getId()).name(a.getName()).icon(a.getIcon()).build()).collect(Collectors.toList());
    }

    private RoomResponse mapToResponse(Room room) {
        Floor floor = room.getFloor();
        Building building = floor != null ? floor.getBuilding() : null;
        BoardingHouse boardingHouse = building != null ? building.getBoardingHouse() : null;

        return RoomResponse.builder()
                .id(room.getId())
                .boardingHouseId(room.getFloor().getBuilding().getBoardingHouse().getId())
                .floorId(floor != null ? floor.getId() : null)
                .floorNumber(floor != null ? floor.getFloorNumber() : null)
                .buildingName(building != null ? building.getName() : null)
                .boardingHouseName(boardingHouse != null ? boardingHouse.getName() : null)
                .roomNumber(room.getRoomNumber())
                .basePrice(room.getBasePrice())
                .area(room.getArea())
                .maxOccupants(room.getMaxOccupants())
                .status(room.getStatus())
                .amenities(mapAmenities(room))
                .imageUrl(room.getImageUrl())
                .createdAt(room.getCreatedAt())
                .build();
    }

    private RoomDetailResponse mapToDetailResponse(Room room) {
        Floor floor = room.getFloor();
        Building building = floor != null ? floor.getBuilding() : null;
        BoardingHouse boardingHouse = building != null ? building.getBoardingHouse() : null;

        return RoomDetailResponse.builder()
                .id(room.getId())
                .boardingHouseId(room.getFloor().getBuilding().getBoardingHouse().getId())
                .floorId(floor != null ? floor.getId() : null)
                .floorNumber(floor != null ? floor.getFloorNumber() : null)
                .buildingId(building != null ? building.getId() : null)
                .buildingName(building != null ? building.getName() : null)
                .boardingHouseId(boardingHouse != null ? boardingHouse.getId() : null)
                .boardingHouseName(boardingHouse != null ? boardingHouse.getName() : null)
                .roomNumber(room.getRoomNumber())
                .basePrice(room.getBasePrice())
                .area(room.getArea())
                .maxOccupants(room.getMaxOccupants())
                .status(room.getStatus())
                .amenities(mapAmenities(room))
                .imageUrl(room.getImageUrl())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }
}
