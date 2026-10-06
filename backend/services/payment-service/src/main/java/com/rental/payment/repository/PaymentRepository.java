package com.rental.payment.repository;

import com.rental.payment.entity.Payment;
import com.rental.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByInvoiceId(Long invoiceId);
    List<Payment> findByStatus(PaymentStatus status);
    List<Payment> findByInvoiceIdAndStatus(Long invoiceId, PaymentStatus status);
    Optional<Payment> findByTransactionCode(String transactionCode);
}
