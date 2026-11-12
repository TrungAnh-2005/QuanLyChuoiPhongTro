package com.rental.auth.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="system_settings") @Getter @Setter
public class SystemSetting {
    @Id @Column(name="setting_key", length=100) private String key;
    @Column(columnDefinition="TEXT",nullable=false) private String value;
}
