package com.example.e_commerce.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryConfig.class);

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
    }

    @PostConstruct
    public void logInitialization() {
        boolean hasCloudName = cloudName != null && !cloudName.isBlank();
        boolean hasApiKey = apiKey != null && !apiKey.isBlank();
        boolean hasApiSecret = apiSecret != null && !apiSecret.isBlank();

        log.warn("==================================================================");
        log.warn("CLOUDINARY BEAN INITIALIZED: cloudName present={}, apiKey present={}, apiSecret present={}",
                hasCloudName, hasApiKey, hasApiSecret);
        log.warn("==================================================================");
    }

}
