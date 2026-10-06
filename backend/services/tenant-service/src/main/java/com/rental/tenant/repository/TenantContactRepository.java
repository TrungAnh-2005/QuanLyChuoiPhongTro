package com.rental.tenant.repository;

import com.rental.tenant.entity.TenantContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TenantContactRepository extends JpaRepository<TenantContact, Long> {
    List<TenantContact> findByTenantId(Long tenantId);
}
