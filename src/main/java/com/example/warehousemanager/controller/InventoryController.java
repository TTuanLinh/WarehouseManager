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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import com.example.warehousemanager.dto.StockLevelDto;
import com.example.warehousemanager.dto.WarehouseStockLineDto;
import com.example.warehousemanager.dto.SetStockQuantityRequest;
import com.example.warehousemanager.dto.ListingUpdateRequest;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    /** Literal path first so it is never mistaken for /{warehouseId}/... */
    @GetMapping("/low-stock")
    public ResponseEntity<List<StockLevelDto>> lowStock(
        @RequestParam(name = "threshold", defaultValue = "10") int threshold
    ) {
        return ResponseEntity.ok(inventoryService.getLowStock(threshold));
    }

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

    @GetMapping("/{warehouseId}/stocks")
    public ResponseEntity<List<WarehouseStockLineDto>> warehouseStocks(
        @PathVariable Long warehouseId
    ) {
        return ResponseEntity.ok(inventoryService.getWarehouseStocks(warehouseId));
    }

    @DeleteMapping("/{warehouseId}/stock/{productId}")
    public ResponseEntity<?> removeProductFromWarehouse(
        @PathVariable Long warehouseId,
        @PathVariable Long productId
    ) {
        inventoryService.removeProductLineFromWarehouse(warehouseId, productId);
        return ResponseEntity.ok("Đã gỡ sản phẩm khỏi kho");
    }

    @PutMapping("/{warehouseId}/listing")
    public ResponseEntity<?> updateListing(
        @PathVariable Long warehouseId,
        @RequestBody ListingUpdateRequest req
    ) {
        inventoryService.updateListing(warehouseId, req);
        return ResponseEntity.ok("Cập nhật trạng thái bày bán thành công");
    }

    @PatchMapping("/{warehouseId}/stock")
    public ResponseEntity<?> setStockQuantityPatch(
        @PathVariable Long warehouseId,
        @RequestBody SetStockQuantityRequest req
    ) {
        inventoryService.setStockQuantity(warehouseId, req);
        return ResponseEntity.ok("Cập nhật tồn kho thành công");
    }

    /** Same as PATCH — some clients / proxies block PATCH and return 404. */
    @PutMapping("/{warehouseId}/stock")
    public ResponseEntity<?> setStockQuantityPut(
        @PathVariable Long warehouseId,
        @RequestBody SetStockQuantityRequest req
    ) {
        inventoryService.setStockQuantity(warehouseId, req);
        return ResponseEntity.ok("Cập nhật tồn kho thành công");
    }
}
