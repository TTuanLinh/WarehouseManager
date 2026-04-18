package com.example.warehousemanager.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.service.WarehouseService;
import com.example.warehousemanager.entity.Warehouse;
import com.example.warehousemanager.dto.WarehouseRequest;
import com.example.warehousemanager.dto.WarehouseContactUpdateRequest;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseService warehouseService;

    @PostMapping
    public ResponseEntity<Warehouse> createWarehouse(@RequestBody WarehouseRequest req) {
        Warehouse warehouse = warehouseService.createWarehouse(req);
        return ResponseEntity.ok(warehouse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Warehouse> getWarehouse(@PathVariable Long id) {
        Warehouse warehouse = warehouseService.getWarehouse(id);
        return ResponseEntity.ok(warehouse);
    }

    @GetMapping
    public ResponseEntity<List<Warehouse>> getAllWarehouses() {
        List<Warehouse> warehouses = warehouseService.getMyWarehouses();
        return ResponseEntity.ok(warehouses);
    }

    @GetMapping("/{id}/name")
    public ResponseEntity<String> getWarehouseName(@PathVariable Long id) {
        String name = warehouseService.getWarehouseName(id);
        return ResponseEntity.ok(name);
    }

    @PutMapping("/{id}/contact")
    public ResponseEntity<Warehouse> updateWarehouseContact(
        @PathVariable Long id,
        @RequestBody WarehouseContactUpdateRequest req
    ) {
        return ResponseEntity.ok(warehouseService.updateWarehouseContact(id, req));
    }
}
