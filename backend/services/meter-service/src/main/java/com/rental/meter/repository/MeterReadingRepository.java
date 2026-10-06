package com.rental.meter.repository;

import com.rental.meter.entity.MeterReading;
import com.rental.meter.entity.MeterType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeterReadingRepository extends JpaRepository<MeterReading, Long> {

    List<MeterReading> findByRoomIdOrderByReadingDateDesc(Long roomId);

    List<MeterReading> findByMeterIdOrderByReadingDateDesc(Long meterId);

    Optional<MeterReading> findFirstByRoomIdAndMeterTypeOrderByReadingDateDesc(Long roomId, MeterType meterType);
}
