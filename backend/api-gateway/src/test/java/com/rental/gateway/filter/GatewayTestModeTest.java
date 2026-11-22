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
    @Test void internalRoomOperationsCannotBeCalledThroughPublicGateway() {
        JwtUtils jwt=mock(JwtUtils.class);
        var filter=new JwtAuthenticationFilter(jwt,new ObjectMapper());
        for (boolean testMode : new boolean[]{true,false}) {
            ReflectionTestUtils.setField(filter,"testMode",testMode);
            for (String path : new String[]{"/api/rooms/1/holds", "/api/rooms/1/holds/7/confirm",
                    "/api/rooms/1/maintenance/start", "/api/rooms/1/maintenance/finish",
                    "/api/rooms/1/holds;x=1", "/api/rooms/1/holds;x=1/7/confirm",
                    "/api/rooms/1/maintenance;x=1/start", "/api/rooms/1/holds%3Bx=1/7/confirm",
                    "/api/rooms/1/path/../holds/7/confirm", "/api/rooms//1/maintenance/start"}) {
                var exchange=MockServerWebExchange.from(MockServerHttpRequest.method(
                        org.springframework.http.HttpMethod.POST, java.net.URI.create(path)).build());
                filter.apply(new JwtAuthenticationFilter.Config()).filter(exchange,forwarded->{
                    fail("Internal endpoint forwarded: " + path);
                    return Mono.empty();
                }).block();
                assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, exchange.getResponse().getStatusCode(), path);
            }
        }
        verifyNoInteractions(jwt);
    }
    @Test void selectedTestRoleDoesNotReceiveOtherRoles() {
        JwtUtils jwt=mock(JwtUtils.class);
        var filter=new JwtAuthenticationFilter(jwt,new ObjectMapper());
        ReflectionTestUtils.setField(filter,"testMode",true);
        for (String role : new String[]{"ADMIN", "STAFF", "TENANT"}) {
            var exchange=MockServerWebExchange.from(MockServerHttpRequest.patch("/api/properties/1/approval").header("X-Test-Role",role).build());
            filter.apply(new JwtAuthenticationFilter.Config()).filter(exchange,forwarded->{
                assertEquals("ROLE_"+role,forwarded.getRequest().getHeaders().getFirst("X-User-Roles"));
                return Mono.empty();
            }).block();
        }
        verifyNoInteractions(jwt);
    }
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
