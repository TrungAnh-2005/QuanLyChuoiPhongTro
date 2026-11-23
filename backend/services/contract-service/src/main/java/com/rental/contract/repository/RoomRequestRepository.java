package com.rental.contract.repository;

import com.rental.contract.entity.RoomRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

@Repository
public interface RoomRequestRepository extends JpaRepository<RoomRequest, Long> {
    List<RoomRequest> findByTenantId(Long tenantId);
    List<RoomRequest> findByStatus(String status);
    @Query("select r.id from RoomRequest r where r.status in ('PENDING', 'HOLDING') and r.holdExpiresAt <= :now order by r.id")
    List<Long> findExpiredReservationIds(@Param("now") Instant now);

    @Query("select r.id from RoomRequest r where r.reservationKey = :key")
    Optional<Long> findReservationIdByKey(@Param("key") String key);

    @Query("select r.id from RoomRequest r where r.tenantId = :tenantId and r.targetRoomId = :roomId " +
            "and r.type in ('RENT', 'NEW_RENT', 'RENTAL', 'HOLD') and r.status in ('PENDING', 'HOLDING') " +
            "and r.holdExpiresAt > :now order by r.id")
    List<Long> findRecoverableReservationIds(@Param("tenantId") Long tenantId, @Param("roomId") Long roomId, @Param("now") Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from RoomRequest r where r.id = :id")
    Optional<RoomRequest> findForReservation(@Param("id") Long id);
}
