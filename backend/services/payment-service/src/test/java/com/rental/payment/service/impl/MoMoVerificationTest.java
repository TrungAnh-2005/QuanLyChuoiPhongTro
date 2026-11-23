package com.rental.payment.service.impl;
import com.rental.payment.config.MoMoConfig;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class MoMoVerificationTest {
    @Test void successCodeAloneIsNotProofOfPayment() {
        var service=new MoMoServiceImpl(mock(MoMoConfig.class));
        assertFalse(service.verifyPayment(Map.of("resultCode","0")));
        assertFalse(service.verifyPayment(Map.of("resultCode","0","signature","forged")));
        assertFalse(service.verifyPayment(Map.of("resultCode","9000","signature","forged")));
    }
}
