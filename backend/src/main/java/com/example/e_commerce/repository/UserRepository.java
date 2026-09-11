package com.example.e_commerce.repository;

import com.example.e_commerce.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByRole(User.Role role);

    long countByRoleAndIsActiveTrue(User.Role role);
    
    @Query("SELECT u FROM User u WHERE " +
           "(:search = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:role IS NULL OR u.role = :role)")
    Page<User> searchUsers(String search, User.Role role, Pageable pageable);
    
    @Modifying
    @Query("UPDATE User u SET u.role = 'USER' WHERE u.role IS NULL")
    void updateNullRolesToUser();
}
