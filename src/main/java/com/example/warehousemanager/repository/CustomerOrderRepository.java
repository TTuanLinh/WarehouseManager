package com.example.warehousemanager.repository;

import com.example.warehousemanager.entity.CustomerOrder;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    @Query("SELECT o FROM CustomerOrder o WHERE o.buyer.id = :userId ORDER BY o.createdAt DESC")
    List<CustomerOrder> findByBuyer(@Param("userId") Long userId);

    @Query("SELECT o FROM CustomerOrder o WHERE o.seller.id = :userId ORDER BY o.createdAt DESC")
    List<CustomerOrder> findBySeller(@Param("userId") Long userId);
}
