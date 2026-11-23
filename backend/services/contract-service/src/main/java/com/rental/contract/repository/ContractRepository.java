package com.rental.contract.repository;

import com.rental.contract.entity.Contract;
import com.rental.contract.entity.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Contract c where c.id = :id")
    Optional<Contract> findForLeave(@Param("id") Long id);

    Optional<Contract> findByContractCode(String contractCode);

    List<Contract> findByTenantId(Long tenantId);

    List<Contract> findByRoomId(Long roomId);

    List<Contract> findByStatus(ContractStatus status);
}
