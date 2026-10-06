package com.rental.billing.repository;

import com.rental.billing.entity.Invoice;
import com.rental.billing.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceCode(String invoiceCode);

    List<Invoice> findByContractId(Long contractId);

    List<Invoice> findByTenantId(Long tenantId);

    List<Invoice> findByRoomId(Long roomId);

    List<Invoice> findByStatus(InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE " +
            "(:status IS NULL OR i.status = :status) AND " +
            "(:tenantId IS NULL OR i.tenantId = :tenantId) AND " +
            "(:month IS NULL OR i.month = :month) AND " +
            "(:year IS NULL OR i.year = :year)")
    List<Invoice> findByFilter(
            @Param("status") InvoiceStatus status,
            @Param("tenantId") Long tenantId,
            @Param("month") Integer month,
            @Param("year") Integer year
    );
}
