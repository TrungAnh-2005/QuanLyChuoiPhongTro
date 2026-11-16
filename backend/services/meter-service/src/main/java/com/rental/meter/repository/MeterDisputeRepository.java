package com.rental.meter.repository;

import com.rental.meter.entity.MeterDispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeterDisputeRepository extends JpaRepository<MeterDispute, Long> {
    List<MeterDispute> findByRoomId(Long roomId);
    List<MeterDispute> findByStatus(String status);
}

