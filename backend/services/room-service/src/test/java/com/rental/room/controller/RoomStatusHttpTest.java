package com.rental.room.controller;

import com.rental.room.dto.RoomResponse;
import com.rental.room.entity.RoomStatus;
import com.rental.room.exception.GlobalExceptionHandler;
import com.rental.room.service.RoomService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RoomStatusHttpTest {
    private final RoomService service = mock(RoomService.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new RoomController(service))
            .setControllerAdvice(new GlobalExceptionHandler()).build();

    @Test void acceptsLockedStatusOnTheHttpEndpoint() throws Exception {
        when(service.updateRoomStatus(103L, RoomStatus.LOCKED))
                .thenReturn(RoomResponse.builder().id(103L).status(RoomStatus.LOCKED).build());
        mvc.perform(patch("/api/rooms/103/status").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"LOCKED\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("LOCKED"));
    }

    @Test void unknownRoomStatusIsAClientErrorRatherThanInternalServerError() throws Exception {
        mvc.perform(patch("/api/rooms/103/status").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"NOT_A_STATUS\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.success").value(false));
        verifyNoInteractions(service);
    }

    @Test void onlyAdminCanApproveAHouse() throws Exception {
        var houses = mock(com.rental.room.service.BoardingHouseService.class);
        var approvalMvc = MockMvcBuilders.standaloneSetup(new BoardingHouseController(houses))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        for (String role : new String[]{"ROLE_STAFF", "ROLE_TENANT", "ROLE_ADMIN_FAKE", ""}) {
            approvalMvc.perform(patch("/api/properties/1/approval").header("X-User-Roles", role))
                    .andExpect(status().isForbidden());
        }
        verifyNoInteractions(houses);
        when(houses.approveBoardingHouse(1L)).thenReturn(com.rental.room.dto.BoardingHouseResponse.builder()
                .id(1L).status("ACTIVE").build());
        approvalMvc.perform(patch("/api/properties/1/approval").header("X-User-Roles", "ROLE_ADMIN"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("ACTIVE"));
        verify(houses).approveBoardingHouse(1L);
    }
}
