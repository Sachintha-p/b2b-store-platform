package com.example.e_commerce.config;

import com.example.e_commerce.model.User;
import com.example.e_commerce.repository.UserRepository;
import com.example.e_commerce.util.JwtUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String googleId = oAuth2User.getAttribute("sub");

        // Find or create the user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setName(name != null ? name : "Google User");
            newUser.setEmail(email);
            newUser.setProvider(User.AuthProvider.GOOGLE);
            newUser.setProviderId(googleId);
            // passwordHash stays null for Google users
            return userRepository.save(newUser);
        });

        // If existing user logged in via local before, update provider info
        if (user.getProvider() == User.AuthProvider.LOCAL) {
            user.setProvider(User.AuthProvider.GOOGLE);
            user.setProviderId(googleId);
            userRepository.save(user);
        }

        // Generate our standard JWT, now including role
        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole() != null ? user.getRole().name() : "USER");

        // Build the absolute redirect URL to the React frontend
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        String redirectUrl = "http://localhost:5173/oauth2/redirect?token=" + encodedToken;

        // Use response.sendRedirect for a clean absolute external redirect
        // (avoids SimpleUrlAuthenticationSuccessHandler treating it as a relative path)
        response.sendRedirect(redirectUrl);
    }
}
