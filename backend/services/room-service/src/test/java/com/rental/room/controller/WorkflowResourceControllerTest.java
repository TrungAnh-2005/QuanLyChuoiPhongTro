package com.rental.room.controller;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class WorkflowResourceControllerTest {
    private final JdbcTemplate jdbc=mock(JdbcTemplate.class);
    private final WorkflowResourceController controller=new WorkflowResourceController(jdbc);
    @Test void rejectsUnknownResourceBeforeExecutingSQL() {
        var error=assertThrows(ResponseStatusException.class,()->controller.list("rooms; DROP TABLE rooms"));
        assertEquals(404,error.getStatusCode().value());verifyNoInteractions(jdbc);
    }
    @Test void rejectsUnlistedColumnBeforeExecutingSQL() {
        var error=assertThrows(ResponseStatusException.class,()->controller.create("service-configs",Map.of("unit_price; DELETE FROM users",10),"ROLE_ADMIN"));
        assertEquals(400,error.getStatusCode().value());verifyNoInteractions(jdbc);
    }
    @Test void tenantCannotModifyAServicePrice() {
        var error=assertThrows(ResponseStatusException.class,()->controller.update("service-configs",1L,Map.of("unitPrice",1),"ROLE_TENANT"));
        assertEquals(403,error.getStatusCode().value());verifyNoInteractions(jdbc);
    }
}
