package com.example.e_commerce.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * For API requests, return 401 JSON instead of redirecting to OAuth login page.
     * Without this, unauthenticated /api/** calls get a 302 -> /oauth2/authorization/google
     * which causes a CORS error in the browser, making the frontend show errors
     * even when the admin is logged in (e.g. token briefly not loaded yet).
     */
    @Bean
    public AuthenticationEntryPoint apiAuthenticationEntryPoint() {
        return (HttpServletRequest request, HttpServletResponse response, AuthenticationException ex) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Authentication required.\",\"path\":\""
                + request.getRequestURI() + "\"}"
            );
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(ex -> ex
                // Return 401 JSON for unauthenticated API requests (not an OAuth redirect)
                .authenticationEntryPoint(apiAuthenticationEntryPoint())
            )
            .authorizeHttpRequests(auth -> auth
                // 1. Explicitly allow guest checkout
                .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()

                // 2. Public API Endpoints
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/categories").permitAll()
                .requestMatchers("/api/coupons/validate", "/api/coupons/active").permitAll()
                .requestMatchers("/api/payments/**").permitAll()
                .requestMatchers("/api/webhooks/**").permitAll()
                // Uploaded product images are served publicly
                .requestMatchers("/uploads/**").permitAll()

                // 3. Admin-only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/orders").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/orders/*/status").hasRole("ADMIN")
                .requestMatchers("/api/coupons/**").hasRole("ADMIN")

                // 4. Authenticated-only routes
                .requestMatchers("/api/orders/my-orders").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/orders/{id}").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/orders/{id}/cancel").authenticated()
                .requestMatchers("/api/users/me/**").authenticated()
                .requestMatchers("/api/notifications/**").authenticated()

                // 5. Catch-all fallback
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2SuccessHandler)
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
