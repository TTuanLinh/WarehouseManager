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
import java.util.List;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @PostMapping("/{warehouseId}/transfer")
    public ResponseEntity<?> transfer(
        @PathVariable Long warehouseId,
        @RequestBody TransferRequest req
    ) {

        inventoryService.transfer(
            req.getProductId(),
            warehouseId,
            req.getToWarehouse(),
            req.getQuantity()
        );

        return ResponseEntity.ok("Transfer thành công");
    }

    @PostMapping("/{warehouseId}/import")
    public ResponseEntity<?> importInventory(
        @PathVariable Long warehouseId,
        @RequestBody List<InventoryRequest> requests
    ) {
        inventoryService.addStocks(warehouseId, requests);
        return ResponseEntity.ok("Thêm nhiều sản phẩm thành công");
    }

    @PostMapping("/{warehouseId}/export")
    public ResponseEntity<?> exportInventory(
        @PathVariable Long warehouseId,
        @RequestBody List<InventoryRequest> requests
    ) {
        inventoryService.removeStocks(warehouseId, requests);
        return ResponseEntity.ok("Xóa nhiều sản phẩm thành công");
    }
}
