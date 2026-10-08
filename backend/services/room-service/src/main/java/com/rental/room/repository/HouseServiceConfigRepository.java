package com.rental.room.repository;

import com.rental.room.entity.HouseServiceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HouseServiceConfigRepository extends JpaRepository<HouseServiceConfig, Long> {
    List<HouseServiceConfig> findByBoardingHouseId(Long boardingHouseId);
}
