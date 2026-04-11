package com.example.warehousemanager.repository;

import com.example.warehousemanager.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Set;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    @Query("""
        SELECT t FROM StockTransaction t
        WHERE
            (t.warehouseId IN :ids
            OR t.fromWarehouseId IN :ids
            OR t.toWarehouseId IN :ids)
            AND (:productId IS NULL OR t.product.id = :productId)
            AND (:filterWarehouseId IS NULL
                OR t.warehouseId = :filterWarehouseId
                OR t.fromWarehouseId = :filterWarehouseId
                OR t.toWarehouseId = :filterWarehouseId)
        """)
    Page<StockTransaction> findFiltered(
        @Param("ids") Set<Long> ids,
        @Param("productId") Long productId,
        @Param("filterWarehouseId") Long filterWarehouseId,
        Pageable pageable
    );
}
