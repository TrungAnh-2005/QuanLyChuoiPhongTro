package com.rental.report.controller;
import com.netflix.discovery.EurekaClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
@RestController @RequestMapping("/api/reports") @RequiredArgsConstructor
public class SystemStatusController {
    private final EurekaClient discovery;
    @GetMapping("/system-status") public Object status(@RequestHeader("X-User-Roles") String roles) {
        if (!roles.contains("ROLE_ADMIN")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        List<Map<String,Object>> result=new ArrayList<>();
        for(String name:List.of("AUTH-SERVICE","ROOM-SERVICE","TENANT-SERVICE","CONTRACT-SERVICE","METER-SERVICE","BILLING-SERVICE","PAYMENT-SERVICE","MAINTENANCE-SERVICE","NOTIFICATION-SERVICE","REPORT-SERVICE","AI-SERVICE")) {
            var app=discovery.getApplication(name);
            boolean online=app!=null && app.getInstances().stream().anyMatch(i->i.getStatus()==com.netflix.appinfo.InstanceInfo.InstanceStatus.UP);
            result.add(Map.of("id",name,"name",name.toLowerCase(Locale.ROOT),"status",online?"UP":"DOWN"));
        }
        return Map.of("success",true,"data",result);
    }
}
