package com.example.e_commerce.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SchemaMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private static final Logger logger = LoggerFactory.getLogger(SchemaMigrationRunner.class);

    @Override
    public void run(String... args) {
        try {
            logger.info("Executing Schema Migration: ALTER TABLE product ALTER COLUMN description TYPE TEXT;");
            jdbcTemplate.execute("ALTER TABLE product ALTER COLUMN description TYPE TEXT;");
            logger.info("Schema Migration Completed: product.description column widened to TEXT successfully.");
        } catch (Exception e) {
            logger.warn("Schema Migration Notice: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE product ALTER COLUMN wholesale_price DROP NOT NULL;");
            logger.info("Schema Migration: wholesale_price NOT NULL constraint dropped.");
        } catch (Exception e) {
            logger.warn("Schema Migration Notice (wholesale_price DROP NOT NULL): {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE product DROP COLUMN IF EXISTS wholesale_price;");
            logger.info("Schema Migration: wholesale_price column dropped successfully.");
        } catch (Exception e) {
            logger.warn("Schema Migration Notice (wholesale_price DROP COLUMN): {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE product ALTER COLUMN admin_price DROP NOT NULL;");
            logger.info("Schema Migration: admin_price NOT NULL constraint dropped.");
        } catch (Exception e) {
            logger.warn("Schema Migration Notice (admin_price DROP NOT NULL): {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE product DROP COLUMN IF EXISTS admin_price;");
            logger.info("Schema Migration: admin_price column dropped successfully.");
        } catch (Exception e) {
            logger.warn("Schema Migration Notice (admin_price DROP COLUMN): {}", e.getMessage());
        }
    }
}
