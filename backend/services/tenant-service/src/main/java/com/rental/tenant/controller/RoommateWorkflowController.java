package com.rental.tenant.controller;
import com.rental.tenant.dto.CreateTenantRequest;
import com.rental.tenant.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController @RequestMapping("/api/tenants/roommate-requests") @RequiredArgsConstructor
public class RoommateWorkflowController {
    private final JdbcTemplate jdbc;
    private final TenantService tenants;

    @PostMapping("/{id}/review")
    @Transactional
    public Object review(@PathVariable Long id,@RequestBody Map<String,Object> body,@RequestHeader("X-User-Roles") String roles) {
        if(!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF")) 
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        
        var request=jdbc.queryForMap("SELECT * FROM roommate_requests WHERE id=? FOR UPDATE",id);
        
        if(!"PENDING".equals(request.get("status"))) 
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Yêu cầu đã được xử lý");
        
        boolean approved=Boolean.TRUE.equals(body.get("approved"));

        if(approved) {
            if(body.get("contractId")==null) 
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Thiếu hợp đồng bảo trợ");
            
            var tenant=tenants.createTenant(CreateTenantRequest.builder()
            .fullName(request.get("full_name").toString())
            .identityCard(request.get("identity_card").toString())
            .phone(request.get("phone").toString())
            .birthDate(((java.sql.Date)request.get("birth_date")).toLocalDate())
            .gender(com.rental.tenant.entity.Gender.valueOf(request.get("gender").toString()))
            .build());
            jdbc.update("INSERT INTO room_members(room_id,tenant_id,contract_id,join_date,role_in_room) " +
                "VALUES(?,?,?,CURRENT_DATE,'MEMBER')",
                request.get("room_id"),tenant.getId(),body.get("contractId"));
        }
        jdbc.update("UPDATE roommate_requests " +
            "SET status=?,rejection_reason=?,reviewed_at=CURRENT_TIMESTAMP " +
            "WHERE id=?",approved?"APPROVED":"REJECTED",body.getOrDefault("rejectionReason",""),id);
        return Map.of("success",true,"data",id);
    }
}
