package com.rental.meter.repository;

import com.rental.meter.entity.Meter;
import com.rental.meter.entity.MeterType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeterRepository extends JpaRepository<Meter, Long> {

    List<Meter> findByRoomId(Long roomId);

    Optional<Meter> findByRoomIdAndMeterType(Long roomId, MeterType meterType);
}
