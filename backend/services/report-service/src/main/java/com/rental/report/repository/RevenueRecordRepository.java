package com.rental.report.repository;

import com.rental.report.entity.RevenueRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RevenueRecordRepository extends JpaRepository<RevenueRecord, Long> {
    List<RevenueRecord> findByYearAndMonth(Integer year, Integer month);
    List<RevenueRecord> findByYear(Integer year);
}
