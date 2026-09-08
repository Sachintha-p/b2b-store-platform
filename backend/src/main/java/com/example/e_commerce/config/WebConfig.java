package com.example.e_commerce.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Removed AuthInterceptor since JwtAuthenticationFilter now handles security globally

    // CORS is now handled by SecurityConfig's CorsConfigurationSource bean
}
