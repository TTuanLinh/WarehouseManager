package com.example.warehousemanager.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.repository.WarehouseRepository;
import com.example.warehousemanager.entity.Warehouse;
import com.example.warehousemanager.dto.WarehouseRequest;
import jakarta.transaction.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    @Transactional
    public Warehouse createWarehouse(WarehouseRequest req) {
        Warehouse warehouse = new Warehouse();
        warehouse.setName(req.getName());
        return warehouseRepository.save(warehouse);
    }

    public Warehouse getWarehouse(Long id) {
        return warehouseRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Warehouse not found"));
    }

    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }
}
