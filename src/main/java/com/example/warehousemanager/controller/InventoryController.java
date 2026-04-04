package com.example.warehousemanager.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.dto.TransferRequest;
import com.example.warehousemanager.service.InventoryService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.ResponseEntity;
import com.example.warehousemanager.dto.InventoryRequest;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@RequestBody TransferRequest req) {

        inventoryService.transfer(
            req.getProductId(),
            req.getFromWarehouse(),
            req.getToWarehouse(),
            req.getQuantity()
        );

        return ResponseEntity.ok("Transfer thành công");
    }

    @PostMapping("/import")
    public ResponseEntity<?> importInventory(@RequestBody InventoryRequest req) {
        inventoryService.addStock(
            req.getProductId(),
            req.getWarehouseId(),
            req.getQuantity()
        );  
        return ResponseEntity.ok("Thêm hàng thành công");
    }

    @PostMapping("/export")
    public ResponseEntity<?> exportInventory(@RequestBody InventoryRequest req) {
        inventoryService.removeStock(
            req.getProductId(),
            req.getWarehouseId(),
            req.getQuantity()
        );
        return ResponseEntity.ok("Xóa hàng thành công");
    }
}
