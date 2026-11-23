package com.rental.contract.repository;

import com.rental.contract.entity.DepositReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DepositReceiptRepository extends JpaRepository<DepositReceipt, Long> {
    Optional<DepositReceipt> findByRequestIdAndReceiptReference(Long requestId, String receiptReference);
    List<DepositReceipt> findByRequestIdOrderByIdAsc(Long requestId);
}
