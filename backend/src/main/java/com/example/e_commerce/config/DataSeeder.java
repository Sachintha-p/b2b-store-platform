package com.example.e_commerce.config;

import com.example.e_commerce.model.Product;
import com.example.e_commerce.model.User;
import com.example.e_commerce.repository.ProductRepository;
import com.example.e_commerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    
    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);
    
    @Value("${admin.seed.password:admin123}")
    private String adminSeedPassword;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        
        // 1. Patch any existing users that have a NULL role
        userRepository.updateNullRolesToUser();
        
        // 2. Seed Admin User
        if (userRepository.findByEmail("admin@example.com").isEmpty()) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail("admin@example.com");
            admin.setPasswordHash(BCrypt.hashpw(adminSeedPassword, BCrypt.gensalt()));
            admin.setRole(User.Role.ADMIN);
            admin.setCustomerGroup(User.CustomerGroup.WHOLESALE); // Or retail, doesn't matter for admin
            userRepository.save(admin);
            
            logger.warn("==================================================================");
            logger.warn("SEEDED ADMIN USER CREATED: admin@example.com");
            logger.warn("This is a dev account. Please change the password or remove in prod!");
            logger.warn("==================================================================");
        }
    
        // 3. Seed Products
        if (productRepository.count() == 0) {
            Product p1 = new Product();
            p1.setName("Premium Office Chair");
            p1.setDescription("Ergonomic office chair with lumbar support.");
            p1.setRetailPrice(new BigDecimal("199.99"));
            p1.setWholesalePrice(new BigDecimal("149.99"));
            p1.setStockQuantity(50);
            p1.setCategory("Furniture");

            Product p2 = new Product();
            p2.setName("Mechanical Keyboard");
            p2.setDescription("RGB mechanical keyboard with tactile switches.");
            p2.setRetailPrice(new BigDecimal("89.99"));
            p2.setWholesalePrice(new BigDecimal("69.99"));
            p2.setStockQuantity(100);
            p2.setCategory("Electronics");

            Product p3 = new Product();
            p3.setName("4K Monitor");
            p3.setDescription("27-inch 4K UHD monitor with 144Hz refresh rate.");
            p3.setRetailPrice(new BigDecimal("349.99"));
            p3.setWholesalePrice(new BigDecimal("299.99"));
            p3.setStockQuantity(30);
            p3.setCategory("Electronics");

            Product p4 = new Product();
            p4.setName("Wireless Mouse");
            p4.setDescription("Precision wireless mouse with long battery life.");
            p4.setRetailPrice(new BigDecimal("49.99"));
            p4.setWholesalePrice(new BigDecimal("39.99"));
            p4.setStockQuantity(200);
            p4.setCategory("Electronics");

            productRepository.saveAll(List.of(p1, p2, p3, p4));
            System.out.println("Seeded 4 sample products into the database.");
        }
    }
}
