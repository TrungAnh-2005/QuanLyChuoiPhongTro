package com.rental.property.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "branch_facilities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchFacility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "boarding_house_id", nullable = false)
    private BoardingHouse boardingHouse;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String icon;
}
