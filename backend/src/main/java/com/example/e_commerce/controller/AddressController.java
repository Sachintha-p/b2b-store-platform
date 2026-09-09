package com.example.e_commerce.controller;

import com.example.e_commerce.model.Address;
import com.example.e_commerce.model.User;
import com.example.e_commerce.repository.AddressRepository;
import com.example.e_commerce.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/addresses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Data
    public static class SetDefaultRequest {
        private String type; // "shipping" or "billing"
    }

    private User getAuthenticatedUser(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @GetMapping
    public List<Address> getAddresses(HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        return addressRepository.findByUserId(user.getId());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Address> createAddress(@RequestBody Address addressReq, HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        
        List<Address> existing = addressRepository.findByUserId(user.getId());
        if (existing.isEmpty()) {
            addressReq.setDefaultShipping(true);
            addressReq.setDefaultBilling(true);
        } else {
            if (addressReq.isDefaultShipping()) {
                existing.stream().filter(Address::isDefaultShipping).forEach(a -> {
                    a.setDefaultShipping(false);
                    addressRepository.save(a);
                });
            }
            if (addressReq.isDefaultBilling()) {
                existing.stream().filter(Address::isDefaultBilling).forEach(a -> {
                    a.setDefaultBilling(false);
                    addressRepository.save(a);
                });
            }
        }
        
        addressReq.setUser(user);
        Address saved = addressRepository.save(addressReq);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Address> updateAddress(@PathVariable Long id, @RequestBody Address addressReq, HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
                
        // Explicit ownership check
        if (!address.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Address does not belong to you");
        }
        
        address.setLabel(addressReq.getLabel());
        address.setLine1(addressReq.getLine1());
        address.setLine2(addressReq.getLine2());
        address.setCity(addressReq.getCity());
        address.setState(addressReq.getState());
        address.setPostalCode(addressReq.getPostalCode());
        address.setCountry(addressReq.getCountry());
        
        return ResponseEntity.ok(addressRepository.save(address));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id, HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
                
        // Explicit ownership check
        if (!address.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Address does not belong to you");
        }
        
        List<Address> allAddresses = addressRepository.findByUserId(user.getId());
        
        if (allAddresses.size() > 1) {
            boolean wasDefaultShipping = address.isDefaultShipping();
            boolean wasDefaultBilling = address.isDefaultBilling();
            
            addressRepository.delete(address);
            allAddresses.remove(address);
            
            if (wasDefaultShipping) {
                Address newDefault = allAddresses.get(allAddresses.size() - 1);
                newDefault.setDefaultShipping(true);
                addressRepository.save(newDefault);
            }
            if (wasDefaultBilling) {
                // Find again in case the same was promoted
                Address newDefault = allAddresses.get(allAddresses.size() - 1);
                newDefault.setDefaultBilling(true);
                addressRepository.save(newDefault);
            }
        } else {
            // It's the only address, allow deletion and leave user with 0 addresses
            addressRepository.delete(address);
        }
        
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/set-default")
    @Transactional
    public ResponseEntity<Address> setDefault(@PathVariable Long id, @RequestBody SetDefaultRequest req, HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
                
        // Explicit ownership check
        if (!address.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Address does not belong to you");
        }
        
        List<Address> allAddresses = addressRepository.findByUserId(user.getId());
        
        if ("shipping".equalsIgnoreCase(req.getType())) {
            for (Address a : allAddresses) {
                if (a.isDefaultShipping() && !a.getId().equals(address.getId())) {
                    a.setDefaultShipping(false);
                    addressRepository.save(a);
                }
            }
            address.setDefaultShipping(true);
        } else if ("billing".equalsIgnoreCase(req.getType())) {
            for (Address a : allAddresses) {
                if (a.isDefaultBilling() && !a.getId().equals(address.getId())) {
                    a.setDefaultBilling(false);
                    addressRepository.save(a);
                }
            }
            address.setDefaultBilling(true);
        }
        
        return ResponseEntity.ok(addressRepository.save(address));
    }
}
