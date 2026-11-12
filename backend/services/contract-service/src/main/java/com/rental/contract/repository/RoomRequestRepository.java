package com.rental.contract.repository;

import com.rental.contract.entity.RoomRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRequestRepository extends JpaRepository<RoomRequest, Long> {
    List<RoomRequest> findByTenantId(Long tenantId);
    List<RoomRequest> findByStatus(String status);
}
