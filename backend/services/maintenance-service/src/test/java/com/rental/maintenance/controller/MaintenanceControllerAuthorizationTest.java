package com.rental.maintenance.controller;

import com.rental.maintenance.dto.CreateMaintenanceRequest;
import com.rental.maintenance.dto.UpdateMaintenanceStatusRequest;
import com.rental.maintenance.entity.MaintenanceStatus;
import com.rental.maintenance.exception.GlobalExceptionHandler;
import com.rental.maintenance.service.MaintenanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MaintenanceControllerAuthorizationTest {
    private MaintenanceService service;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(MaintenanceService.class);
        mvc = MockMvcBuilders.standaloneSetup(new MaintenanceController(service))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void tenantCannotBlockVacantRoom() throws Exception {
        mvc.perform(post("/api/maintenance").header("X-User-Roles", "ROLE_TENANT")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"roomId\":3,\"title\":\"Repair\",\"description\":\"Leak\",\"blocksRental\":true}"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(service);
    }

    @Test
    void staffMayCreateRoomLevelTicketWithoutTenant() throws Exception {
        mvc.perform(post("/api/maintenance").header("X-User-Roles", "ROLE_STAFF")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"roomId\":3,\"title\":\"Repair\",\"description\":\"Leak\",\"blocksRental\":true}"))
                .andExpect(status().isCreated());
        verify(service).createMaintenanceRequest(any(CreateMaintenanceRequest.class));
    }

    @Test
    void ordinaryTicketStillRequiresTenant() throws Exception {
        mvc.perform(post("/api/maintenance").header("X-User-Roles", "ROLE_STAFF")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"roomId\":3,\"title\":\"Repair\",\"description\":\"Leak\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void tenantAndLookalikeRolesCannotChangeTicketStatus() throws Exception {
        for (String roles : new String[]{"ROLE_TENANT", "ROLE_STAFF_FAKE", "PREFIX_ROLE_ADMIN", ""}) {
            mvc.perform(put("/api/maintenance/7/status").header("X-User-Roles", roles)
                    .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"RESOLVED\"}"))
                    .andExpect(status().isForbidden());
        }
        verifyNoInteractions(service);
    }

    @Test
    void exactManagerRoleMayChangeTicketStatus() throws Exception {
        mvc.perform(put("/api/maintenance/7/status").header("X-User-Roles", "ROLE_TENANT, ROLE_ADMIN")
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"RESOLVED\"}"))
                .andExpect(status().isOk());
        verify(service).updateMaintenanceStatus(eq(7L), any(UpdateMaintenanceStatusRequest.class));
    }
}
