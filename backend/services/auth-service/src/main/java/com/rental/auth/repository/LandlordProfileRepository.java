package com.rental.auth.repository;

import com.rental.auth.entity.LandlordProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LandlordProfileRepository extends JpaRepository<LandlordProfile, Long> {
    Optional<LandlordProfile> findByUserId(Long userId);
    Optional<LandlordProfile> findByIdentityCard(String identityCard);
}
