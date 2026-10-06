package com.rental.tenant.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tenant_contacts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "contact_name", nullable = false, length = 100)
    private String contactName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 50)
    private String relationship;
}
