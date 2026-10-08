package com.rental.contract.repository;

import com.rental.contract.entity.MoveOutSettlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MoveOutSettlementRepository extends JpaRepository<MoveOutSettlement, Long> {
    Optional<MoveOutSettlement> findByContractId(Long contractId);
}
