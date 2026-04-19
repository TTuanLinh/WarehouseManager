package com.example.warehousemanager.repository;

import com.example.warehousemanager.entity.UserWarehouse;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserWarehouseRepository extends JpaRepository<UserWarehouse, Long> {

    List<UserWarehouse> findByUserId(Long userId);

    List<UserWarehouse> findByWarehouseId(Long warehouseId);

    List<UserWarehouse> findByUserIdAndWarehouseId(Long userId, Long warehouseId);

    List<UserWarehouse> findByUserIdAndWarehouseIdAndRole(Long userId, Long warehouseId, String role);

    Optional<UserWarehouse> findFirstByUserIdAndWarehouseId(Long userId, Long warehouseId);

    boolean existsByUserIdAndWarehouseId(Long userId, Long warehouseId);

    void deleteByUserIdAndWarehouseId(Long userId, Long warehouseId);

    @Query("""
        SELECT COUNT(uw) FROM UserWarehouse uw
        WHERE uw.warehouse.id = :wid
        AND (UPPER(TRIM(COALESCE(uw.role, 'ADMIN'))) = 'ADMIN')
        """)
    long countAdminsForWarehouse(@Param("wid") Long warehouseId);
}
