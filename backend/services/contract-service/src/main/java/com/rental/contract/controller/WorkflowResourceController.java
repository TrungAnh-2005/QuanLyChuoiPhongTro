package com.rental.contract.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

/** Explicitly whitelisted relational resources for the browser workflows. */
@RestController @RequestMapping("/api/contracts/records") @RequiredArgsConstructor
public class WorkflowResourceController {
    private final JdbcTemplate jdbc;
    record Resource(String table, Set<String> columns) {}
    private static final Map<String, Resource> RESOURCES = Map.ofEntries(Map.entry("requests", new Resource("room_requests", Set.of("type","contract_id","tenant_id","target_room_id","current_room_id","duration_months","note","forfeit_deposit","status","reviewed_at"))),
Map.entry("settlements", new Resource("move_out_settlements", Set.of("contract_id","room_id","tenant_id","move_out_date","reason","original_deposit","unpaid_utilities_fee","damage_fee","damage_description","refund_amount","bank_account","bank_name","account_holder","refund_status","settled_at"))));
    private void manager(String roles) {
        if (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    private Resource resource(String name) {
        Resource r = RESOURCES.get(name);
        if (r == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return r;
    }
    private Map<String,Object> values(Resource r, Map<String,Object> body) {
        Map<String,Object> values = new LinkedHashMap<>();
        body.forEach((key,value) -> {
            String column = key.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase(Locale.ROOT);
            if (!r.columns().contains(column)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported field: " + key);
            if (value instanceof Map || value instanceof List) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expected scalar: " + key);
            values.put(column, value);
        });
        if (values.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty request");
        return values;
    }
    private Map<String,Object> envelope(Object data) { return Map.of("success", true, "data", data); }
    @GetMapping("/{name}") public Map<String,Object> list(@PathVariable String name) {
        return envelope(jdbc.queryForList("SELECT * FROM `" + resource(name).table() + "` ORDER BY id DESC LIMIT 2000"));
    }
    @PostMapping("/{name}") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> create(@PathVariable String name, @RequestBody Map<String,Object> body, @RequestHeader("X-User-Roles") String roles) {
        if (Set.of("service-configs","buildings","floors","saas","members").contains(name)) manager(roles);
        Resource r = resource(name);
        Map<String,Object> insertValues = values(r,body);
        if (r.columns().contains("status")) insertValues.putIfAbsent("status",name.equals("members")?"ACTIVE":name.equals("saas")?"UNPAID":"PENDING");
        insertValues.put("created_at",java.time.LocalDateTime.now());
        if (!Set.of("requests","disputes").contains(name)) insertValues.put("updated_at",java.time.LocalDateTime.now());
        Number id = new SimpleJdbcInsert(jdbc).withTableName(r.table()).usingColumns(insertValues.keySet().toArray(String[]::new)).usingGeneratedKeyColumns("id").executeAndReturnKey(insertValues);
        return envelope(jdbc.queryForMap("SELECT * FROM `" + r.table() + "` WHERE id = ?", id));
    }
    @PatchMapping("/{name}/{id}") @Transactional
    public Map<String,Object> update(@PathVariable String name, @PathVariable Long id, @RequestBody Map<String,Object> body, @RequestHeader("X-User-Roles") String roles) {
        manager(roles);
        Resource r = resource(name); Map<String,Object> v = values(r,body);
        String assignments = String.join(",", v.keySet().stream().map(c -> "`"+c+"` = ?").toList());
        List<Object> args = new ArrayList<>(v.values()); args.add(id);
        if (jdbc.update("UPDATE `"+r.table()+"` SET "+assignments+" WHERE id = ?",args.toArray()) == 0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return envelope(jdbc.queryForMap("SELECT * FROM `" + r.table() + "` WHERE id = ?", id));
    }
    @DeleteMapping("/{name}/{id}") @Transactional
    public Map<String,Object> delete(@PathVariable String name, @PathVariable Long id, @RequestHeader("X-User-Roles") String roles) {
        manager(roles);
        if (jdbc.update("DELETE FROM `"+resource(name).table()+"` WHERE id = ?",id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return envelope(id);
    }
}
