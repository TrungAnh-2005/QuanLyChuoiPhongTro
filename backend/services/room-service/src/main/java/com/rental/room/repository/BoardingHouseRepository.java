package com.rental.room.repository;

import com.rental.room.entity.BoardingHouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public interface BoardingHouseRepository extends JpaRepository<BoardingHouse, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from BoardingHouse h where h.id = :id")
    Optional<BoardingHouse> findLockedById(@Param("id") Long id);
}
