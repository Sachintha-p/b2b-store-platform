package com.example.e_commerce.controller;

import com.example.e_commerce.model.User;
import com.example.e_commerce.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class UserController {

    private final UserRepository userRepository;

    @Data
    public static class ProfileUpdateRequest {
        private String name;
        private String shippingAddress;
    }

    @Data
    public static class PasswordUpdateRequest {
        private String currentPassword;
        private String newPassword;
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateProfile(@RequestBody ProfileUpdateRequest request, HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name cannot be empty");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setName(request.getName());
        user.setShippingAddress(request.getShippingAddress());

        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> updatePassword(@RequestBody PasswordUpdateRequest request, HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getProvider() == User.AuthProvider.GOOGLE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google accounts do not have passwords");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters long");
        }

        if (!BCrypt.checkpw(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        user.setPasswordHash(BCrypt.hashpw(request.getNewPassword(), BCrypt.gensalt()));
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }
}
