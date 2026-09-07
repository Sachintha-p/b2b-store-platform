package com.example.e_commerce.config;

import com.example.e_commerce.model.Product;
import com.example.e_commerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(String... args) throws Exception {
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
