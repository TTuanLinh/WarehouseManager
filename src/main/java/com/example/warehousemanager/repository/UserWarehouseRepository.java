package com.example.warehousemanager.repository;

import com.example.warehousemanager.entity.UserWarehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserWarehouseRepository extends JpaRepository<UserWarehouse, Long> {

    List<UserWarehouse> findByUserId(Long userId);

    List<UserWarehouse> findByWarehouseId(Long warehouseId);

    List<UserWarehouse> findByUserIdAndWarehouseId(Long userId, Long warehouseId);

    List<UserWarehouse> findByUserIdAndWarehouseIdAndRole(Long userId, Long warehouseId, String role);
}
