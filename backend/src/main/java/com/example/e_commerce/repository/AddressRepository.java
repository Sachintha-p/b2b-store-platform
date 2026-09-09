package com.example.e_commerce.repository;

import com.example.e_commerce.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserId(Long userId);
    List<Address> findByUserIdAndIsDefaultShippingTrue(Long userId);
    List<Address> findByUserIdAndIsDefaultBillingTrue(Long userId);
}
