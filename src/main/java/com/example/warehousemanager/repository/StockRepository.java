package com.example.warehousemanager.repository;

import com.example.warehousemanager.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByWarehouseIdAndProductId(Long warehouseId, Long productId);
}
