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
/**
 * @deprecated Quy hoach mo rong du phong V2.0. Trong V1.0 thanh vien cu tru duoc quan ly qua bang room_members.
 */
@Deprecated
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

