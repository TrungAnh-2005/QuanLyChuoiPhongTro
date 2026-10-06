package com.rental.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.util.UUID;

@Slf4j
@Component
public class LoggingAndTracingGlobalFilter implements GlobalFilter, Ordered {

    private static final String REQUEST_ID_HEADER = "X-Request-Id";
    private static final String START_TIME_ATTR = "startTime";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        exchange.getAttributes().put(START_TIME_ATTR, startTime);

        ServerHttpRequest request = exchange.getRequest();
        String requestId = request.getHeaders().getFirst(REQUEST_ID_HEADER);
        if (requestId == null || requestId.trim().isEmpty()) {
            requestId = UUID.randomUUID().toString();
        }

        final String finalRequestId = requestId;
        ServerHttpRequest mutatedRequest = request.mutate()
                .header(REQUEST_ID_HEADER, finalRequestId)
                .build();

        ServerHttpResponse response = exchange.getResponse();
        response.getHeaders().set(REQUEST_ID_HEADER, finalRequestId);

        String path = mutatedRequest.getURI().getPath();
        String method = mutatedRequest.getMethod().name();
        InetSocketAddress remoteAddress = mutatedRequest.getRemoteAddress();
        String clientIp = remoteAddress != null ? remoteAddress.getAddress().getHostAddress() : "UNKNOWN";

        log.info("[GATEWAY-REQ] [{}] {} {} from {}", finalRequestId, method, path, clientIp);

        return chain.filter(exchange.mutate().request(mutatedRequest).build())
                .then(Mono.fromRunnable(() -> {
                    long duration = System.currentTimeMillis() - startTime;
                    int statusCode = response.getStatusCode() != null ? response.getStatusCode().value() : 200;
                    log.info("[GATEWAY-RES] [{}] {} {} status: {} duration: {}ms",
                            finalRequestId, method, path, statusCode, duration);
                }));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
