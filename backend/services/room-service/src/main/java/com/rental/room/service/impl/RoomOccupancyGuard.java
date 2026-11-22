package com.rental.room.service.impl;

import com.rental.room.client.OccupancyContractClient;
import com.rental.room.client.OccupancyMemberClient;
import com.rental.room.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoomOccupancyGuard {
    private final OccupancyContractClient contracts;
    private final OccupancyMemberClient members;

    public void requireVacant(Long roomId) {
        boolean occupied;
        try {
            var contractResult = contracts.contracts();
            var memberResult = members.members();
            if (contractResult == null || !contractResult.isSuccess() || contractResult.getData() == null
                    || memberResult == null || !memberResult.isSuccess() || memberResult.getData() == null) {
                throw new IllegalStateException("Missing occupancy response");
            }
            occupied = contractResult.getData().stream().anyMatch(c -> roomId.equals(c.roomId()) && ("ACTIVE".equals(c.status()) || "EXPIRING".equals(c.status())))
                    || memberResult.getData().stream().anyMatch(m -> roomId.equals(m.roomId()) && "ACTIVE".equals(m.status()));
        } catch (Exception error) {
            throw new AppException("Chưa xác minh được người đang ở. Vui lòng thử lại sau.", HttpStatus.SERVICE_UNAVAILABLE, "OCCUPANCY_UNAVAILABLE");
        }
        if (occupied) throw new AppException("Phòng còn người thuê, không thể đặt cọc hoặc ngừng cho thuê để bảo trì.", HttpStatus.CONFLICT, "ROOM_OCCUPIED");
    }
}
