package com.example.e_commerce.controller;

import com.example.e_commerce.model.Product;
import com.example.e_commerce.repository.ProductRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;

    // ---- Public READ endpoints ----

    @GetMapping
    public List<Product> getAllProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Integer limit) {

        if ((query == null || query.isBlank()) &&
            (category == null || category.isBlank()) &&
            minPrice == null &&
            maxPrice == null) {

            if ("newest".equalsIgnoreCase(sort) && limit != null) {
                return productRepository.findAll(
                    org.springframework.data.domain.PageRequest.of(0, limit,
                        org.springframework.data.domain.Sort.by(
                            org.springframework.data.domain.Sort.Direction.DESC, "id")))
                    .getContent()
                    .stream()
                    .filter(p -> !p.isArchived())
                    .toList();
            }
            // Return only non-archived products
            return productRepository.findAll().stream()
                    .filter(p -> !p.isArchived())
                    .toList();
        }

        String formattedQuery = null;
        if (query != null && !query.isBlank()) {
            formattedQuery = query.trim().replaceAll("\\s+", " & ");
        }

        return productRepository.searchProducts(formattedQuery, category, minPrice, maxPrice);
    }

    @GetMapping("/categories")
    public List<com.example.e_commerce.dto.CategoryCountDTO> getCategories() {
        return productRepository.getCategoryCounts();
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<List<Product>> getRelatedProducts(@PathVariable Long id) {
        return productRepository.findById(id).map(product -> {
            if (product.getCategory() == null || product.getCategory().isBlank()) {
                return ResponseEntity.ok(List.<Product>of());
            }
            List<Product> related = productRepository.findByCategoryAndIdNot(product.getCategory(), id);
            if (related.size() > 4) {
                related = related.subList(0, 4);
            }
            return ResponseEntity.ok(related);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ---- Admin WRITE endpoints ----

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        product.setIsArchived(false);
        Product savedProduct = productRepository.save(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody Product productDetails) {
        return productRepository.findById(id)
                .map(existing -> {
                    existing.setName(productDetails.getName());
                    existing.setDescription(productDetails.getDescription());
                    existing.setRetailPrice(productDetails.getRetailPrice());
                    existing.setWholesalePrice(productDetails.getWholesalePrice());
                    existing.setStockQuantity(productDetails.getStockQuantity());
                    existing.setCategory(productDetails.getCategory());
                    // Never overwrite imageUrl or isArchived via PUT body
                    return ResponseEntity.ok(productRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Soft-delete: sets isArchived=true instead of hard deleting.
     * This prevents FK constraint violations from OrderItems referencing this product.
     * Also deletes any associated image file from disk.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(existing -> {
                    // Delete image file from disk if present (best-effort)
                    String imageUrl = existing.getImageUrl();
                    if (imageUrl != null && !imageUrl.isBlank()) {
                        try {
                            String filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
                            java.nio.file.Path filePath = java.nio.file.Paths.get(System.getProperty("user.dir"), "uploads", "products").resolve(filename);
                            java.nio.file.Files.deleteIfExists(filePath);
                        } catch (java.io.IOException e) {
                            System.err.println("Warning: could not delete image file on product archive: " + e.getMessage());
                        }
                    }
                    // Soft delete — do NOT hard delete to preserve order history
                    existing.setIsArchived(true);
                    existing.setImageUrl(null);
                    productRepository.save(existing);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
