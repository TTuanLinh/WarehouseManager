package com.example.warehousemanager.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.repository.StockTransactionRepository;
import com.example.warehousemanager.repository.UserWarehouseRepository;
import com.example.warehousemanager.entity.StockTransaction;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import com.example.warehousemanager.security.CurrentUserService;

@Service
@RequiredArgsConstructor
public class TransactionsService {

    private final StockTransactionRepository stockTransactionRepository;
    private final UserWarehouseRepository userWarehouseRepository;
    private final CurrentUserService currentUserService;

    public List<StockTransaction> getAllTransactions() {
        Long currentUserId = currentUserService.getCurrentUserId();
        Set<Long> allowedWarehouseIds = userWarehouseRepository.findByUserId(currentUserId)
            .stream()
            .map(uw -> uw.getWarehouse().getId())
            .collect(Collectors.toSet());

        return stockTransactionRepository.findAll()
            .stream()
            .filter(tx -> isVisible(tx, allowedWarehouseIds))
            .collect(Collectors.toList());
    }

    private boolean isVisible(StockTransaction tx, Set<Long> allowedWarehouseIds) {
        if (tx.getWarehouseId() != null) {
            return allowedWarehouseIds.contains(tx.getWarehouseId());
        }
        if (tx.getFromWarehouseId() != null && allowedWarehouseIds.contains(tx.getFromWarehouseId())) {
            return true;
        }
        return tx.getToWarehouseId() != null && allowedWarehouseIds.contains(tx.getToWarehouseId());
    }
}
