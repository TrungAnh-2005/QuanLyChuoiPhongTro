package com.rental.auth.repository;
import com.rental.auth.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SystemSettingRepository extends JpaRepository<SystemSetting,String> {}
