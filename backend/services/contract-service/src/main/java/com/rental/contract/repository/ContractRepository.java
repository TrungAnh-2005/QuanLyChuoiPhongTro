package com.rental.contract.repository;

import com.rental.contract.entity.Contract;
import com.rental.contract.entity.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    Optional<Contract> findByContractCode(String contractCode);

    List<Contract> findByTenantId(Long tenantId);

    List<Contract> findByRoomId(Long roomId);

    List<Contract> findByStatus(ContractStatus status);
}
