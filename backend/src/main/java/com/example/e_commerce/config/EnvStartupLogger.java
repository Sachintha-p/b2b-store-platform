package com.example.e_commerce.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EnvStartupLogger {

    private static final Logger log = LoggerFactory.getLogger(EnvStartupLogger.class);

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret:}")
    private String googleClientSecret;

    @PostConstruct
    public void logEnvironmentStatus() {
        boolean hasGoogleId = googleClientId != null && !googleClientId.isBlank();
        boolean hasGoogleSecret = googleClientSecret != null && !googleClientSecret.isBlank();

        log.warn("==================================================================");
        log.warn("ENVIRONMENT VARS CHECK: Google Client ID present={}, Google Client Secret present={}",
                hasGoogleId, hasGoogleSecret);
        log.warn("==================================================================");
    }
}
