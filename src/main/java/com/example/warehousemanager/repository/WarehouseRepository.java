package com.example.warehousemanager.repository;

import com.example.warehousemanager.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;  
import java.util.List;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    Optional<Warehouse> findByName(String name);
    Optional<Warehouse> findById(Long id);
    List<Warehouse> findAll();
}
