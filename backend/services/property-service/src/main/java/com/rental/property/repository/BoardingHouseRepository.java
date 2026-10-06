package com.rental.property.repository;

import com.rental.property.entity.BoardingHouse;
import com.rental.property.entity.HouseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardingHouseRepository extends JpaRepository<BoardingHouse, Long> {

    Optional<BoardingHouse> findByCode(String code);

    boolean existsByCode(String code);

    List<BoardingHouse> findByStatus(HouseStatus status);
}
