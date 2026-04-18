package com.example.warehousemanager.repository;

import com.example.warehousemanager.entity.CustomerOrderItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerOrderItemRepository extends JpaRepository<CustomerOrderItem, Long> {
    List<CustomerOrderItem> findByOrderId(Long orderId);
}
