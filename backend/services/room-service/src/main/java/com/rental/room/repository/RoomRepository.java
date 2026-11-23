package com.rental.room.repository;

import com.rental.room.entity.Room;
import com.rental.room.entity.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r where r.id = :id")
    Optional<Room> findLockedById(@Param("id") Long id);

    @Query("select r.floor.building.boardingHouse.id from Room r where r.id = :id")
    Optional<Long> findHouseIdByRoomId(@Param("id") Long id);

    @Query("select r.id from Room r where r.status = :status and r.holdExpiresAt <= :now order by r.id")
    List<Long> findExpiredHoldIds(@Param("status") RoomStatus status, @Param("now") Instant now, Pageable page);

    List<Room> findByStatus(RoomStatus status);

    List<Room> findByFloorId(Long floorId);

    @Query("SELECT r FROM Room r WHERE (:status IS NULL OR r.status = :status) AND (:floorId IS NULL OR r.floor.id = :floorId)")
    List<Room> findByFilter(@Param("status") RoomStatus status, @Param("floorId") Long floorId);
}
