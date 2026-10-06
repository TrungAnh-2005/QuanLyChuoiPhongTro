package com.rental.property.repository;

import com.rental.property.entity.BranchFacility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BranchFacilityRepository extends JpaRepository<BranchFacility, Long> {

    List<BranchFacility> findByBoardingHouseId(Long boardingHouseId);
}
