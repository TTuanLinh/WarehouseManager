package com.example.warehousemanager.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.repository.WarehouseRepository;
import com.example.warehousemanager.entity.Warehouse;
import com.example.warehousemanager.dto.WarehouseRequest;
import jakarta.transaction.Transactional;
import java.util.List;

import com.example.warehousemanager.entity.UserWarehouse;
import com.example.warehousemanager.entity.User;
import com.example.warehousemanager.repository.UserRepository;
import com.example.warehousemanager.repository.UserWarehouseRepository;
import com.example.warehousemanager.security.CurrentUserService;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final UserWarehouseRepository userWarehouseRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public Warehouse createWarehouse(WarehouseRequest req) {
        Warehouse warehouse = new Warehouse();
        warehouse.setName(req.getName());
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
        return warehouseRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Warehouse not found"));
    }

    public String getWarehouseName(Long id) {
        return getWarehouse(id).getName();
    }
}
