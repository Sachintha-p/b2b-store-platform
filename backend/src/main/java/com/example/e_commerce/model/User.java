package com.example.e_commerce.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {

    public enum CustomerGroup {
        RETAIL, WHOLESALE
    }

    public enum AuthProvider {
        LOCAL, GOOGLE
    }
    
    public enum Role {
        USER, ADMIN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    @Column(unique = true)
    private String email;

    @JsonIgnore
    private String passwordHash; // Nullable for OAuth2 users

    private String shippingAddress;

    @Enumerated(EnumType.STRING)
    private CustomerGroup customerGroup = CustomerGroup.RETAIL;

    @Enumerated(EnumType.STRING)
    private AuthProvider provider = AuthProvider.LOCAL;

    private String providerId;
    
    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;
    
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Address> addresses = new java.util.ArrayList<>();
    
    // Business/Profile Fields
    private String phone;
    private String companyName;
    private String taxId;
    
    // Notification Preferences
    private Boolean notifyOrderUpdates = true;
    private Boolean notifyPromotions = true;

    // Status
    private Boolean isActive = true;

    // Custom getter to ensure backward compatibility/null safety if needed
    public boolean isNotifyOrderUpdates() {
        return notifyOrderUpdates != null && notifyOrderUpdates;
    }

    public boolean isActive() {
        return isActive == null || isActive; // True if null (backward compat) or true
    }
}
