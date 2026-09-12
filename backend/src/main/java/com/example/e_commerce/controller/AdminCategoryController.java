package com.example.e_commerce.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.e_commerce.model.Category;
import com.example.e_commerce.repository.CategoryRepository;
import com.example.e_commerce.repository.ProductRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.e_commerce.dto.CategoryResponseDTO;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final Cloudinary cloudinary;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5MB

    @GetMapping
    public ResponseEntity<java.util.List<CategoryResponseDTO>> getAllCategories() {
        java.util.List<CategoryResponseDTO> list = categoryRepository.findAllByOrderByNameAsc().stream()
                .map(cat -> new CategoryResponseDTO(
                        cat.getId(),
                        cat.getName(),
                        cat.getImageUrl(),
                        cat.getImagePublicId(),
                        cat.getCreatedAt(),
                        productRepository.countByCategoryIgnoreCase(cat.getName())
                ))
                .toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(@Valid @RequestBody Category category) {
        if (category.getName() == null || category.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name is required.");
        }

        String name = category.getName().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category '" + name + "' already exists.");
        }

        Category newCategory = new Category();
        newCategory.setName(name);
        Category saved = categoryRepository.save(newCategory);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<Category> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        validateFile(file);

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found with ID: " + id));

        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "categories",
                    "resource_type", "image"
            ));

            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            if (secureUrl == null || publicId == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Cloudinary upload failed: missing secure_url or public_id in response");
            }

            // Cleanup old Cloudinary image if replacing
            if (category.getImagePublicId() != null && !category.getImagePublicId().isBlank()) {
                try {
                    cloudinary.uploader().destroy(category.getImagePublicId(), ObjectUtils.emptyMap());
                } catch (Exception e) {
                    System.err.println("Warning: failed to delete previous Cloudinary category image: " + e.getMessage());
                }
            }

            category.setImageUrl(secureUrl);
            category.setImagePublicId(publicId);
            return ResponseEntity.ok(categoryRepository.save(category));

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to upload category image to Cloudinary: " + e.getMessage(), e);
        }
    }

    @DeleteMapping("/{id}/image")
    public ResponseEntity<Category> deleteImage(@PathVariable Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found with ID: " + id));

        if (category.getImagePublicId() == null || category.getImagePublicId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not have an image to delete.");
        }

        try {
            cloudinary.uploader().destroy(category.getImagePublicId(), ObjectUtils.emptyMap());
            category.setImageUrl(null);
            category.setImagePublicId(null);
            return ResponseEntity.ok(categoryRepository.save(category));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to delete category image from Cloudinary: " + e.getMessage(), e);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found with ID: " + id));

        long productCount = productRepository.countByCategoryIgnoreCase(category.getName());
        if (productCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                    "Cannot delete category '" + category.getName() + "' because " + productCount + " product(s) are currently using it.");
        }

        if (category.getImagePublicId() != null && !category.getImagePublicId().isBlank()) {
            try {
                cloudinary.uploader().destroy(category.getImagePublicId(), ObjectUtils.emptyMap());
            } catch (Exception e) {
                System.err.println("Warning: failed to delete Cloudinary image for category '" + category.getName() + "': " + e.getMessage());
            }
        }

        categoryRepository.delete(category);
        return ResponseEntity.noContent().build();
    }

    private void validateFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid file type '" + contentType + "'. Only JPEG, PNG, and WebP images are allowed.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "File too large (" + (file.getSize() / 1024 / 1024) + "MB). Maximum allowed size is 5MB.");
        }

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file is empty.");
        }
    }
}
