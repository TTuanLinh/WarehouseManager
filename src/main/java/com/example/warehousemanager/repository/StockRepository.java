package com.example.warehousemanager.repository;

import com.example.warehousemanager.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface StockRepository extends JpaRepository<Stock, Long> {
    @Query("SELECT s FROM Stock s WHERE s.warehouse.id = :warehouseId AND s.product.id = :productId")
    Optional<Stock> findByWarehouseIdAndProductId(
        @Param("warehouseId") Long warehouseId,
        @Param("productId") Long productId
    );

    @Query("""
        SELECT s FROM Stock s
        JOIN FETCH s.warehouse w
        JOIN FETCH s.product p
        WHERE w.id IN :warehouseIds AND s.quantity <= :threshold
        ORDER BY s.quantity ASC, p.name ASC
        """)
    List<Stock> findLowStock(
        @Param("warehouseIds") Set<Long> warehouseIds,
        @Param("threshold") int threshold
    );

    /**
     * Native SQL avoids JPQL INNER JOIN on product hiding rows when the FK row is missing or not visible to JPA.
     * LEFT JOIN still returns quantity from {@code stock}; names may be null.
     */
    @Query(
        value = """
            SELECT s.product_id AS productId,
                   p.name AS productName,
                   p.sku AS sku,
                   s.quantity AS quantity
            FROM stock s
            LEFT JOIN product p ON p.id = s.product_id
            WHERE s.warehouse_id = :warehouseId
            ORDER BY COALESCE(p.name, ''), s.product_id
            """,
        nativeQuery = true
    )
    List<WarehouseStockLineProjection> listLinesForWarehouse(@Param("warehouseId") Long warehouseId);
}
