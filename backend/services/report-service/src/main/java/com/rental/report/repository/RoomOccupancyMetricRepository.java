package com.rental.report.repository;

import com.rental.report.entity.RoomOccupancyMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface RoomOccupancyMetricRepository extends JpaRepository<RoomOccupancyMetric, Long> {
    Optional<RoomOccupancyMetric> findTopByOrderByMetricDateDesc();
    Optional<RoomOccupancyMetric> findByMetricDate(LocalDate metricDate);
}
