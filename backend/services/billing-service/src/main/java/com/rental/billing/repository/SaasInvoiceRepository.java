package com.rental.billing.repository;

import com.rental.billing.entity.SaasInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaasInvoiceRepository extends JpaRepository<SaasInvoice, Long> {
    List<SaasInvoice> findByLandlordId(Long landlordId);
}
