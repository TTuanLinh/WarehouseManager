package com.example.warehousemanager.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.repository.ProductRepository;
import com.example.warehousemanager.entity.Product;
import com.example.warehousemanager.dto.ProductRequest;
import jakarta.transaction.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional
    public Product createProduct(ProductRequest req) {
        if (productRepository.findBySku(req.getSku()).isPresent()) {
            throw new RuntimeException("Product already exists");
        }
        Product product = new Product();
        product.setName(req.getName());
        product.setSku(req.getSku());
        return productRepository.save(product);
    }

    public Product getProduct(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
}
