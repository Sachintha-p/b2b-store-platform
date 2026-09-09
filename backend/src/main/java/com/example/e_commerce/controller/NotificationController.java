package com.example.e_commerce.controller;

import com.example.e_commerce.model.Notification;
import com.example.e_commerce.model.User;
import com.example.e_commerce.repository.NotificationRepository;
import com.example.e_commerce.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    // 6. Confirm GET /api/notifications/me accepts page and size query parameters and returns results ordered by createdAt descending
    @GetMapping("/me")
    public Page<Notification> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<Long> getUnreadCount(HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        return ResponseEntity.ok(notificationRepository.countByUserIdAndIsReadFalse(user.getId()));
    }

    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id, HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
                
        // Explicit ownership check
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Notification does not belong to you");
        }
        
        notification.setRead(true);
        return ResponseEntity.ok(notificationRepository.save(notification));
    }

    @PutMapping("/me/read-all")
    @Transactional
    public ResponseEntity<Void> markAllAsRead(HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        // Simplistic approach for MVP: fetch and save
        // A direct UPDATE query would be more efficient in production
        List<Notification> notifications = notificationRepository.findAll().stream()
                .filter(n -> n.getUser().getId().equals(user.getId()) && !n.isRead())
                .toList();
                
        for (Notification n : notifications) {
            n.setRead(true);
            notificationRepository.save(n);
        }
        return ResponseEntity.ok().build();
    }
}
