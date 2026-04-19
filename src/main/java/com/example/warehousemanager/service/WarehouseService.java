package com.example.warehousemanager.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.repository.WarehouseRepository;
import com.example.warehousemanager.entity.Warehouse;
import com.example.warehousemanager.dto.WarehouseRequest;
import com.example.warehousemanager.dto.WarehouseContactUpdateRequest;
import jakarta.transaction.Transactional;
import java.util.List;

import com.example.warehousemanager.entity.UserWarehouse;
import com.example.warehousemanager.entity.User;
import com.example.warehousemanager.repository.UserRepository;
import com.example.warehousemanager.repository.UserWarehouseRepository;
import com.example.warehousemanager.security.CurrentUserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final UserWarehouseRepository userWarehouseRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final WarehouseAccessService warehouseAccessService;

    @Transactional
    public Warehouse createWarehouse(WarehouseRequest req) {
        Warehouse warehouse = new Warehouse();
        warehouse.setName(req.getName());
        warehouse.setAddress(req.getAddress());
        warehouse.setPhone(req.getPhone());
        warehouse = warehouseRepository.save(warehouse);

        Long currentUserId = currentUserService.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        UserWarehouse userWarehouse = new UserWarehouse();
        userWarehouse.setUser(currentUser);
        userWarehouse.setWarehouse(warehouse);
        userWarehouse.setRole("ADMIN");
        userWarehouseRepository.save(userWarehouse);
        return warehouse;
    }

    public List<Warehouse> getMyWarehouses() {
        Long currentUserId = currentUserService.getCurrentUserId();
        return userWarehouseRepository.findByUserId(currentUserId)
            .stream()
            .map(UserWarehouse::getWarehouse)
            .collect(Collectors.toList());
    }

    public Warehouse getWarehouse(Long id) {
        warehouseAccessService.requireMembership(id);
        return warehouseRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Warehouse not found"));
    }

    public String getWarehouseName(Long id) {
        warehouseAccessService.requireMembership(id);
        return warehouseRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Warehouse not found"))
            .getName();
    }

    @Transactional
    public Warehouse updateWarehouseContact(Long id, WarehouseContactUpdateRequest req) {
        warehouseAccessService.requireAdmin(id);
        Warehouse w = warehouseRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Warehouse not found"));
        w.setAddress(req.getAddress());
        w.setPhone(req.getPhone());
        return warehouseRepository.save(w);
    }
}
