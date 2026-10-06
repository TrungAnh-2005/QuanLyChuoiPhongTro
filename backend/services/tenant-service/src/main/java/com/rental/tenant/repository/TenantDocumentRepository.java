package com.rental.tenant.repository;

import com.rental.tenant.entity.TenantDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TenantDocumentRepository extends JpaRepository<TenantDocument, Long> {
    List<TenantDocument> findByTenantId(Long tenantId);
}
