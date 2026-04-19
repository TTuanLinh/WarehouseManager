package com.example.warehousemanager.service;

import com.example.warehousemanager.dto.AddWarehouseMemberRequest;
import com.example.warehousemanager.dto.WarehouseMemberDto;
import com.example.warehousemanager.entity.User;
import com.example.warehousemanager.entity.UserWarehouse;
import com.example.warehousemanager.entity.Warehouse;
import com.example.warehousemanager.entity.WarehouseRole;
import com.example.warehousemanager.repository.UserRepository;
import com.example.warehousemanager.repository.UserWarehouseRepository;
import com.example.warehousemanager.repository.WarehouseRepository;
import com.example.warehousemanager.security.CurrentUserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class WarehouseMemberService {
    private final UserWarehouseRepository userWarehouseRepository;
    private final UserRepository userRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseAccessService warehouseAccessService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<WarehouseMemberDto> listMembers(Long warehouseId) {
        warehouseAccessService.requireAdmin(warehouseId);
        return userWarehouseRepository.findByWarehouseId(warehouseId).stream()
            .map(uw -> new WarehouseMemberDto(
                uw.getUser().getId(),
                uw.getUser().getUsername(),
                normalizeRoleLabel(uw.getRole())
            ))
            .toList();
    }

    @Transactional
    public List<WarehouseMemberDto> addMember(Long warehouseId, AddWarehouseMemberRequest req) {
        warehouseAccessService.requireAdmin(warehouseId);
        if (req.getUsername() == null || req.getUsername().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
        }
        WarehouseRole role;
        try {
            role = WarehouseRole.fromString(req.getRole());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Warehouse not found"));

        String uname = req.getUsername().trim();
        User target = userRepository.findByUsername(uname)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng: " + uname));

        Long currentId = currentUserService.getCurrentUserId();
        if (target.getId().equals(currentId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể thêm chính mình (bạn đã có trong kho).");
        }
        if (userWarehouseRepository.existsByUserIdAndWarehouseId(target.getId(), warehouseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người dùng đã có trong kho này.");
        }

        UserWarehouse uw = new UserWarehouse();
        uw.setUser(target);
        uw.setWarehouse(warehouse);
        uw.setRole(role.name());
        userWarehouseRepository.save(uw);
        return listMembers(warehouseId);
    }

    @Transactional
    public void removeMember(Long warehouseId, Long memberUserId) {
        warehouseAccessService.requireAdmin(warehouseId);
        UserWarehouse target = userWarehouseRepository.findFirstByUserIdAndWarehouseId(memberUserId, warehouseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thành viên không thuộc kho này"));

        if (WarehouseRole.isAdmin(target.getRole())) {
            long admins = userWarehouseRepository.countAdminsForWarehouse(warehouseId);
            if (admins <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể xóa quản trị cuối cùng của kho.");
            }
        }
        userWarehouseRepository.delete(target);
    }

    private static String normalizeRoleLabel(String role) {
        return WarehouseRole.isAdmin(role) ? WarehouseRole.ADMIN.name() : WarehouseRole.STAFF.name();
    }
}
