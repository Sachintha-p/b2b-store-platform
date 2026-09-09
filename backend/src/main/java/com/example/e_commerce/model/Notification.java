package com.example.e_commerce.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {

    public enum NotificationType {
        ORDER_STATUS, PROMOTION, SYSTEM
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String message;

    private boolean isRead = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    private Long relatedOrderId;
}
