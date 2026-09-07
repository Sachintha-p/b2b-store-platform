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

    @GetMapping
    public List<Product> getAllProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {
        
        // If all parameters are null or empty, return all products
        if ((query == null || query.isBlank()) && 
            (category == null || category.isBlank()) && 
            minPrice == null && 
            maxPrice == null) {
            return productRepository.findAll();
        }
        
        String formattedQuery = null;
        if (query != null && !query.isBlank()) {
            // Format query for Postgres to_tsquery (e.g. 'gaming & mouse:*')
            formattedQuery = query.trim().replaceAll("\\s+", " & ");
        }

        return productRepository.searchProducts(formattedQuery, category, minPrice, maxPrice);
    }
    
    @GetMapping("/{id}/related")
    public ResponseEntity<List<Product>> getRelatedProducts(@PathVariable Long id) {
        return productRepository.findById(id).map(product -> {
            if (product.getCategory() == null || product.getCategory().isBlank()) {
                return ResponseEntity.ok(List.<Product>of());
            }
            List<Product> related = productRepository.findByCategoryAndIdNot(product.getCategory(), id);
            // Limit to 4
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

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        Product savedProduct = productRepository.save(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody Product productDetails) {
        return productRepository.findById(id)
                .map(existingProduct -> {
                    existingProduct.setName(productDetails.getName());
                    existingProduct.setDescription(productDetails.getDescription());
                    existingProduct.setRetailPrice(productDetails.getRetailPrice());
                    existingProduct.setWholesalePrice(productDetails.getWholesalePrice());
                    existingProduct.setStockQuantity(productDetails.getStockQuantity());
                    existingProduct.setCategory(productDetails.getCategory());
                    Product updatedProduct = productRepository.save(existingProduct);
                    return ResponseEntity.ok(updatedProduct);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(existingProduct -> {
                    productRepository.delete(existingProduct);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
