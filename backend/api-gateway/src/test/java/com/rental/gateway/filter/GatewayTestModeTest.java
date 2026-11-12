package com.rental.gateway.filter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rental.gateway.util.JwtUtils;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class GatewayTestModeTest {
    @Test void coreRoutesCanBeTestedWithoutAnAccountOrToken() {
        JwtUtils jwt=mock(JwtUtils.class);
        var filter=new JwtAuthenticationFilter(jwt,new ObjectMapper());
        ReflectionTestUtils.setField(filter,"testMode",true);
        var exchange=MockServerWebExchange.from(MockServerHttpRequest.get("/api/rooms").build());
        filter.apply(new JwtAuthenticationFilter.Config()).filter(exchange,forwarded->{
            assertEquals("2",forwarded.getRequest().getHeaders().getFirst("X-User-Id"));
            assertTrue(forwarded.getRequest().getHeaders().getFirst("X-User-Roles").contains("ROLE_STAFF"));
            assertNull(forwarded.getRequest().getHeaders().getFirst("Authorization"));
            return Mono.empty();
        }).block();
        verifyNoInteractions(jwt);
    }
}
