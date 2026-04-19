package com.example.warehousemanager.controller;

import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.dto.AddWarehouseMemberRequest;
import com.example.warehousemanager.dto.WarehouseContactUpdateRequest;
import com.example.warehousemanager.dto.WarehouseMemberDto;
import com.example.warehousemanager.dto.WarehouseMyRoleDto;
import com.example.warehousemanager.dto.WarehouseRequest;
import com.example.warehousemanager.entity.Warehouse;
import com.example.warehousemanager.service.WarehouseAccessService;
import com.example.warehousemanager.service.WarehouseMemberService;
import com.example.warehousemanager.service.WarehouseService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseService warehouseService;
    private final WarehouseAccessService warehouseAccessService;
    private final WarehouseMemberService warehouseMemberService;

    @PostMapping
    public ResponseEntity<Warehouse> createWarehouse(@RequestBody WarehouseRequest req) {
        Warehouse warehouse = warehouseService.createWarehouse(req);
        return ResponseEntity.ok(warehouse);
    }

    @GetMapping("/{id}/my-role")
    public ResponseEntity<WarehouseMyRoleDto> myWarehouseRole(@PathVariable Long id) {
        return ResponseEntity.ok(new WarehouseMyRoleDto(warehouseAccessService.currentRole(id)));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<WarehouseMemberDto>> listWarehouseMembers(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseMemberService.listMembers(id));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<List<WarehouseMemberDto>> addWarehouseMember(
        @PathVariable Long id,
        @RequestBody AddWarehouseMemberRequest body
    ) {
        return ResponseEntity.ok(warehouseMemberService.addMember(id, body));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeWarehouseMember(@PathVariable Long id, @PathVariable Long userId) {
        warehouseMemberService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
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
