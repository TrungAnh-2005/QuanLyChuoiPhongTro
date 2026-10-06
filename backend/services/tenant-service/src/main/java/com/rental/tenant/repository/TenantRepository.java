package com.rental.tenant.repository;

import com.rental.tenant.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findByIdentityCard(String identityCard);

    Optional<Tenant> findByPhone(String phone);

    boolean existsByIdentityCard(String identityCard);

    boolean existsByPhone(String phone);

    @Query("SELECT t FROM Tenant t WHERE " +
            "(:keyword IS NULL OR LOWER(t.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR t.phone LIKE CONCAT('%', :keyword, '%') " +
            "OR t.identityCard LIKE CONCAT('%', :keyword, '%'))")
    List<Tenant> searchByKeyword(@Param("keyword") String keyword);
}
