package com.rental.room.repository;

import com.rental.room.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Long> {
    List<Building> findByBoardingHouseId(Long boardingHouseId);
}
