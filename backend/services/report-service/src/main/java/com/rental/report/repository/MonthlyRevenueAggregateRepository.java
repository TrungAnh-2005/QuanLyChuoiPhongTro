package com.rental.report.repository;

import com.rental.report.entity.MonthlyRevenueAggregate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyRevenueAggregateRepository extends JpaRepository<MonthlyRevenueAggregate, Long> {
    Optional<MonthlyRevenueAggregate> findByYearAndMonth(Integer year, Integer month);
    List<MonthlyRevenueAggregate> findByYearOrderByMonthAsc(Integer year);
}
