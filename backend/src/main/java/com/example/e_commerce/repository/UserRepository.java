package com.example.e_commerce.repository;

import com.example.e_commerce.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    @Modifying
    @Query("UPDATE User u SET u.role = 'USER' WHERE u.role IS NULL")
    void updateNullRolesToUser();
}
