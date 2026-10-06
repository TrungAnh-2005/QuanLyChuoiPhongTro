package com.rental.room.repository;

import com.rental.room.entity.Room;
import com.rental.room.entity.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByStatus(RoomStatus status);

    List<Room> findByFloorId(Long floorId);

    @Query("SELECT r FROM Room r WHERE (:status IS NULL OR r.status = :status) AND (:floorId IS NULL OR r.floor.id = :floorId)")
    List<Room> findByFilter(@Param("status") RoomStatus status, @Param("floorId") Long floorId);
}
