package com.example.e_commerce.config;

import com.example.e_commerce.model.User;
import com.example.e_commerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AdminPasswordResetRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private static final Logger logger = LoggerFactory.getLogger(AdminPasswordResetRunner.class);

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        userRepository.findByEmail("admin@example.com").ifPresent(admin -> {
            String newPassword = "AdminSecurePassword123!";
            admin.setPasswordHash(BCrypt.hashpw(newPassword, BCrypt.gensalt()));
            userRepository.save(admin);
            logger.warn("==================================================================");
            logger.warn("ADMIN PASSWORD FOR admin@example.com HAS BEEN RESET TO: {}", newPassword);
            logger.warn("==================================================================");
        });
    }
}
