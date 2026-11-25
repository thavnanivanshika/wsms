package com.wsms;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/** Verifies the full Spring context boots (JDK 25 / Spring Boot 3.5). */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.mail.username=",
        "wsms.jwt.secret=test-secret-test-secret-test-secret-0123456789"
})
class WsmsApplicationTests {

    @Test
    void contextLoads() {
    }
}
