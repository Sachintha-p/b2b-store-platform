package com.example.e_commerce.controller;

import com.example.e_commerce.model.User;
import com.example.e_commerce.repository.UserRepository;
import com.example.e_commerce.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class AdminUserController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    private Long getCurrentUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.extractUserId(token);
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) User.Role role,
            @RequestParam(required = false) User.CustomerGroup customerGroup,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        String safeSearch = search == null ? "" : search;
        return ResponseEntity.ok(userRepository.searchUsers(safeSearch, role, customerGroup, pageable));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<User> updateRole(@PathVariable Long id, @RequestBody RoleUpdateRequest request, HttpServletRequest httpRequest) {
        Long currentUserId = getCurrentUserId(httpRequest);
        if (currentUserId != null && currentUserId.equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot modify your own admin status");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() == User.Role.ADMIN && request.getRole() != User.Role.ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndIsActiveTrue(User.Role.ADMIN);
            if (activeAdminCount <= 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot remove the last active admin account.");
            }
        }

        user.setRole(request.getRole());
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/{id}/customer-group")
    public ResponseEntity<User> updateCustomerGroup(@PathVariable Long id, @RequestBody CustomerGroupUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setCustomerGroup(request.getCustomerGroup());
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<User> updateStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request, HttpServletRequest httpRequest) {
        Long currentUserId = getCurrentUserId(httpRequest);
        if (currentUserId != null && currentUserId.equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot modify your own admin status");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() == User.Role.ADMIN && !request.isActive()) {
            long activeAdminCount = userRepository.countByRoleAndIsActiveTrue(User.Role.ADMIN);
            if (activeAdminCount <= 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot remove the last active admin account.");
            }
        }

        user.setIsActive(request.isActive());
        return ResponseEntity.ok(userRepository.save(user));
    }

    @Data
    public static class RoleUpdateRequest {
        private User.Role role;
    }

    @Data
    public static class CustomerGroupUpdateRequest {
        private User.CustomerGroup customerGroup;
    }

    @Data
    public static class StatusUpdateRequest {
        private boolean isActive;
    }
}
