package com.example.warehousemanager.service;

import com.example.warehousemanager.entity.UserWarehouse;
import com.example.warehousemanager.entity.WarehouseRole;
import com.example.warehousemanager.repository.UserWarehouseRepository;
import com.example.warehousemanager.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequiredArgsConstructor
public class WarehouseAccessService {
    private final UserWarehouseRepository userWarehouseRepository;
    private final CurrentUserService currentUserService;

    public UserWarehouse requireMembership(Long warehouseId) {
        Long uid = currentUserService.getCurrentUserId();
        return userWarehouseRepository.findFirstByUserIdAndWarehouseId(uid, warehouseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this warehouse"));
    }

    public UserWarehouse requireAdmin(Long warehouseId) {
        UserWarehouse uw = requireMembership(warehouseId);
        if (!WarehouseRole.isAdmin(uw.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ quản trị (ADMIN) mới thực hiện được thao tác này.");
        }
        return uw;
    }

    public String currentRole(Long warehouseId) {
        Long uid = currentUserService.getCurrentUserId();
        return userWarehouseRepository.findFirstByUserIdAndWarehouseId(uid, warehouseId)
            .map(uw -> WarehouseRole.isAdmin(uw.getRole()) ? WarehouseRole.ADMIN.name() : WarehouseRole.STAFF.name())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this warehouse"));
    }
}
