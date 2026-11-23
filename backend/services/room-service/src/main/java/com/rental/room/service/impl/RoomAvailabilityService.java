package com.rental.room.service.impl;

import com.rental.room.entity.Room;
import com.rental.room.entity.RoomStatus;
import com.rental.room.exception.AppException;
import com.rental.room.repository.BoardingHouseRepository;
import com.rental.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RoomAvailabilityService {
    private final RoomRepository rooms;
    private final RoomOccupancyGuard occupants;
    private final BoardingHouseRepository houses;

    private Room lockedRoom(Long id) {
        // Scalar lookup avoids stale managed Room data while waiting for the lock.
        Long houseId = rooms.findHouseIdByRoomId(id)
                .orElseThrow(() -> error("Không tìm thấy phòng.", "ROOM_NOT_FOUND", HttpStatus.NOT_FOUND));
        houses.findLockedById(houseId)
                .orElseThrow(() -> error("Không tìm thấy cơ sở.", "HOUSE_NOT_FOUND", HttpStatus.NOT_FOUND));
        Room room = rooms.findLockedById(id)
                .orElseThrow(() -> error("Không tìm thấy phòng.", "ROOM_NOT_FOUND", HttpStatus.NOT_FOUND));
        if (!Objects.equals(houseId, room.getFloor().getBuilding().getBoardingHouse().getId())) {
            throw error("Phòng vừa chuyển cơ sở. Vui lòng thử lại.", "ROOM_MOVED", HttpStatus.CONFLICT);
        }
        return room;
    }

    private void requireActiveHouse(Room room) {
        if (!"ACTIVE".equals(room.getFloor().getBuilding().getBoardingHouse().getStatus())) {
            throw error("Cơ sở chưa hoạt động hoặc đang khóa.", "HOUSE_NOT_ACTIVE", HttpStatus.CONFLICT);
        }
    }

    private boolean expired(Room room) {
        return room.getStatus() == RoomStatus.HOLDING && room.getHoldExpiresAt() != null
                && !room.getHoldExpiresAt().isAfter(Instant.now());
    }

    private void clearHold(Room room) {
        room.setHoldRequestId(null);
        room.setHoldTenantId(null);
        room.setHoldExpiresAt(null);
    }

    private void expireIfDue(Room room) {
        if (expired(room)) {
            room.setStatus(RoomStatus.AVAILABLE);
            clearHold(room);
            rooms.save(room);
        }
    }

    @Transactional
    public Room hold(Long id, Long requestId, Long tenantId, Instant expiresAt) {
        if (requestId == null || requestId <= 0 || tenantId == null || tenantId <= 0 || expiresAt == null
                || !expiresAt.isAfter(Instant.now()) || expiresAt.isAfter(Instant.now().plusSeconds(7 * 24 * 60 * 60))) {
            throw error("Thông tin hoặc hạn đặt cọc không hợp lệ (tối đa 7 ngày).", "INVALID_HOLD", HttpStatus.BAD_REQUEST);
        }
        Room room = lockedRoom(id);
        expireIfDue(room);
        requireActiveHouse(room);
        if (room.getStatus() == RoomStatus.HOLDING && Objects.equals(room.getHoldRequestId(), requestId)
                && Objects.equals(room.getHoldTenantId(), tenantId)) return room;
        if (room.getStatus() != RoomStatus.AVAILABLE) throw busy();
        occupants.requireVacant(id);
        room.setStatus(RoomStatus.HOLDING);
        room.setHoldRequestId(requestId);
        room.setHoldTenantId(tenantId);
        room.setHoldExpiresAt(expiresAt);
        room.setMaintenanceRequestId(null);
        rooms.save(room);
        return room;
    }

    @Transactional
    public Room confirmHold(Long id, Long requestId, Long tenantId) {
        Room room = lockedRoom(id);
        requireActiveHouse(room);
        if (requestId == null || tenantId == null || !Objects.equals(room.getHoldRequestId(), requestId)
                || !Objects.equals(room.getHoldTenantId(), tenantId)) throw busy();
        if (room.getStatus() == RoomStatus.OCCUPIED) return room;
        if (room.getStatus() != RoomStatus.HOLDING || expired(room)) {
            throw error("Đặt cọc đã hết hạn hoặc phòng không còn được giữ.", "HOLD_EXPIRED", HttpStatus.CONFLICT);
        }
        room.setStatus(RoomStatus.OCCUPIED);
        room.setHoldExpiresAt(null);
        rooms.save(room);
        return room;
    }

    @Transactional
    public Room releaseHold(Long id, Long requestId) {
        Room room = lockedRoom(id);
        if (room.getStatus() == RoomStatus.AVAILABLE) return room;
        if (room.getStatus() != RoomStatus.HOLDING || !Objects.equals(room.getHoldRequestId(), requestId)) throw busy();
        room.setStatus(RoomStatus.AVAILABLE);
        clearHold(room);
        rooms.save(room);
        return room;
    }

    @Transactional
    public Room startMaintenance(Long id, Long ticketId) {
        if (ticketId == null || ticketId <= 0) throw error("Thiếu phiếu bảo trì.", "INVALID_MAINTENANCE", HttpStatus.BAD_REQUEST);
        Room room = lockedRoom(id);
        expireIfDue(room);
        requireActiveHouse(room);
        if (room.getStatus() == RoomStatus.MAINTENANCE && Objects.equals(room.getMaintenanceRequestId(), ticketId)) return room;
        if (room.getStatus() != RoomStatus.AVAILABLE) throw busy();
        occupants.requireVacant(id);
        room.setStatus(RoomStatus.MAINTENANCE);
        room.setMaintenanceRequestId(ticketId);
        clearHold(room);
        rooms.save(room);
        return room;
    }

    @Transactional
    public Room finishMaintenance(Long id, Long ticketId) {
        Room room = lockedRoom(id);
        if (room.getStatus() == RoomStatus.AVAILABLE) return room;
        boolean matchesTicket = room.getMaintenanceRequestId() == null || Objects.equals(room.getMaintenanceRequestId(), ticketId);
        if (room.getStatus() != RoomStatus.MAINTENANCE || !matchesTicket) throw busy();
        occupants.requireVacant(id);
        room.setStatus(RoomStatus.AVAILABLE);
        room.setMaintenanceRequestId(null);
        rooms.save(room);
        return room;
    }

    @Scheduled(fixedDelayString = "${room.hold-expiry-check-ms:30000}")
    @Transactional
    public void expireHolds() {
        for (Long id : rooms.findExpiredHoldIds(RoomStatus.HOLDING, Instant.now(), PageRequest.of(0, 100))) {
            expireIfDue(lockedRoom(id));
        }
    }

    private AppException busy() {
        return error("Phòng đang được đặt cọc, đang thuê, bảo trì hoặc khóa. Vui lòng tải lại dữ liệu.", "ROOM_BUSY", HttpStatus.CONFLICT);
    }

    private AppException error(String message, String code, HttpStatus status) {
        return new AppException(message, status, code);
    }
}
