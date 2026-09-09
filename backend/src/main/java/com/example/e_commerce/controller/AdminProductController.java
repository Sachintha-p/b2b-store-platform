package com.example.e_commerce.controller;

import com.example.e_commerce.model.Product;
import com.example.e_commerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

/**
 * Admin-only product image management endpoints.
 * All routes under /api/admin/** are protected by SecurityConfig (hasRole ADMIN).
 */
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class AdminProductController {

    private final ProductRepository productRepository;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5MB
    // Absolute path resolved from JVM working dir (backend/) so it never points to Tomcat temp
    private static final Path UPLOAD_DIR = Paths.get(System.getProperty("user.dir"), "uploads", "products");

    /**
     * POST /api/admin/products/{id}/image
     * Upload and associate an image with a product.
     * Validates content type and size, stores to ./uploads/products/, updates imageUrl.
     */
    @PostMapping("/{id}/image")
    public ResponseEntity<Product> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid file type '" + contentType + "'. Only JPEG, PNG, and WebP images are allowed.");
        }

        // Validate file size (Spring framework limit is in application.properties;
        // this is our own explicit check for a clean error message)
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "File too large (" + (file.getSize() / 1024 / 1024) + "MB). Maximum allowed size is 5MB.");
        }

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file is empty.");
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        try {
            // Ensure upload directory exists (created outside src/ so it survives rebuilds)
            Files.createDirectories(UPLOAD_DIR);

            // Delete old image file if replacing
            deleteImageFileIfExists(product.getImageUrl());

            // Generate collision-safe filename: {productId}_{uuid}.{ext}
            String ext = getExtension(file.getOriginalFilename(), contentType);
            String filename = id + "_" + UUID.randomUUID().toString().replace("-", "") + "." + ext;

            Path targetPath = UPLOAD_DIR.resolve(filename);
            file.transferTo(targetPath.toFile());

            // Store the public URL; served via WebConfig /uploads/** resource handler
            product.setImageUrl("http://localhost:8080/uploads/products/" + filename);
            return ResponseEntity.ok(productRepository.save(product));

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to store image file: " + e.getMessage());
        }
    }

    /**
     * DELETE /api/admin/products/{id}/image
     * Removes image file from disk and clears imageUrl on product.
     */
    @DeleteMapping("/{id}/image")
    public ResponseEntity<Product> deleteImage(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        deleteImageFileIfExists(product.getImageUrl());
        product.setImageUrl(null);
        return ResponseEntity.ok(productRepository.save(product));
    }

    // ---- Helpers ----

    private void deleteImageFileIfExists(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        try {
            String filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            Path filePath = UPLOAD_DIR.resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            System.err.println("Warning: could not delete image file from disk: " + e.getMessage());
        }
    }

    private String getExtension(String originalFilename, String contentType) {
        if (originalFilename != null && originalFilename.contains(".")) {
            return originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "bin";
        };
    }
}
