package com.rental.tenant.repository;

import com.rental.tenant.entity.RoommateRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoommateRequestRepository extends JpaRepository<RoommateRequest, Long> {
    List<RoommateRequest> findByRoomId(Long roomId);
    List<RoommateRequest> findByStatus(String status);
}
