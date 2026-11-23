package com.rental.room.controller;

import com.rental.room.entity.HouseServiceConfig;
import com.rental.room.repository.BoardingHouseRepository;
import com.rental.room.repository.BuildingRepository;
import com.rental.room.repository.FloorRepository;
import com.rental.room.repository.HouseServiceConfigRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RoomStructureControllerTest {

    private final HouseServiceConfigRepository serviceConfigRepo = mock(HouseServiceConfigRepository.class);
    private final BuildingRepository buildingRepo = mock(BuildingRepository.class);
    private final FloorRepository floorRepo = mock(FloorRepository.class);
    private final BoardingHouseRepository houseRepo = mock(BoardingHouseRepository.class);

    private final RoomStructureController controller =
            new RoomStructureController(serviceConfigRepo, buildingRepo, floorRepo, houseRepo);

    @Test
    void tenantCannotModifyServicePrice() {
        var req = new RoomStructureController.ServiceConfigRequest(null, null, null, BigDecimal.ONE, null);
        var error = assertThrows(ResponseStatusException.class,
                () -> controller.updateServiceConfig(1L, req, "ROLE_TENANT"));
        assertEquals(403, error.getStatusCode().value());
        verifyNoInteractions(serviceConfigRepo);
    }

    @Test
    void updateMissingServiceConfigReturnsNotFound() {
        when(serviceConfigRepo.findById(99L)).thenReturn(Optional.empty());
        var req = new RoomStructureController.ServiceConfigRequest(null, null, null, BigDecimal.TEN, null);
        var error = assertThrows(ResponseStatusException.class,
                () -> controller.updateServiceConfig(99L, req, "ROLE_ADMIN"));
        assertEquals(404, error.getStatusCode().value());
    }

    @Test
    void createServiceConfigSavesViaRepository() {
        var req = new RoomStructureController.ServiceConfigRequest(1L, "Điện", "METER", new BigDecimal("3500"), true);
        var saved = HouseServiceConfig.builder()
                .id(10L)
                .boardingHouseId(1L)
                .serviceName("Điện")
                .calculationType("METER")
                .unitPrice(new BigDecimal("3500"))
                .isActive(true)
                .build();
        when(serviceConfigRepo.save(any(HouseServiceConfig.class))).thenReturn(saved);

        var response = controller.createServiceConfig(req, "ROLE_ADMIN");
        assertTrue(response.isSuccess());
        assertEquals(10L, response.getData().getId());
        verify(serviceConfigRepo).save(any(HouseServiceConfig.class));
    }
}

