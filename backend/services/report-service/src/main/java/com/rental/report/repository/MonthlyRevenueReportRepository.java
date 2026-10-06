package com.rental.report.repository;

import com.rental.report.entity.MonthlyRevenueReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyRevenueReportRepository extends JpaRepository<MonthlyRevenueReport, Long> {
    Optional<MonthlyRevenueReport> findByYearAndMonth(Integer year, Integer month);
    List<MonthlyRevenueReport> findByYearOrderByMonthAsc(Integer year);
}
