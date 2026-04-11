package com.example.warehousemanager.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.repository.StockTransactionRepository;
import com.example.warehousemanager.repository.UserWarehouseRepository;
import com.example.warehousemanager.entity.StockTransaction;
import java.util.Set;
import java.util.stream.Collectors;
import com.example.warehousemanager.security.CurrentUserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TransactionsService {

    private final StockTransactionRepository stockTransactionRepository;
    private final UserWarehouseRepository userWarehouseRepository;
    private final CurrentUserService currentUserService;

    public Page<StockTransaction> getTransactions(Long productId, Long warehouseId, Pageable pageable) {
        Long currentUserId = currentUserService.getCurrentUserId();
        Set<Long> allowedWarehouseIds = userWarehouseRepository.findByUserId(currentUserId)
            .stream()
            .map(uw -> uw.getWarehouse().getId())
            .collect(Collectors.toSet());

        if (allowedWarehouseIds.isEmpty()) {
            return Page.empty(pageable);
        }

        if (warehouseId != null && !allowedWarehouseIds.contains(warehouseId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this warehouse");
        }

        return stockTransactionRepository.findFiltered(allowedWarehouseIds, productId, warehouseId, pageable);
    }
}
