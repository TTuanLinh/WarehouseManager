package com.example.warehousemanager.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.dto.DailyStatsDto;
import com.example.warehousemanager.repository.StockTransactionRepository;
import com.example.warehousemanager.repository.UserWarehouseRepository;
import com.example.warehousemanager.repository.WarehouseRepository;
import com.example.warehousemanager.entity.StockTransaction;
import com.example.warehousemanager.entity.Warehouse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final WarehouseRepository warehouseRepository;
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

    public DailyStatsDto.Response getMonthlyStats(Long warehouseId, int year, int month) {
        Long currentUserId = currentUserService.getCurrentUserId();
        boolean hasAccess = userWarehouseRepository.existsByUserIdAndWarehouseId(currentUserId, warehouseId);
        if (!hasAccess) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this warehouse");
        }
        if (month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "month must be 1-12");
        }

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Warehouse not found"));

        List<StockTransaction> txList = stockTransactionRepository.findByWarehouseAndMonth(warehouseId, year, month);

        // Aggregate by day-of-month; long[4]: [importQty, exportQty, transferIn, transferOut]
        Map<Integer, long[]> dayMap = new HashMap<>();
        for (StockTransaction tx : txList) {
            int day = tx.getCreatedAt().getDayOfMonth();
            long[] acc = dayMap.computeIfAbsent(day, k -> new long[4]);
            String type = tx.getType() != null ? tx.getType() : "";
            int qty = tx.getQuantity() != null ? tx.getQuantity() : 0;
            switch (type) {
                case "IMPORT", "ORDER_IMPORT" -> acc[0] += qty;
                case "EXPORT", "ORDER_EXPORT"  -> acc[1] += qty;
                case "TRANSFER" -> {
                    if (warehouseId.equals(tx.getToWarehouseId()))   acc[2] += qty;
                    if (warehouseId.equals(tx.getFromWarehouseId())) acc[3] += qty;
                }
                default -> {}
            }
        }

        List<DailyStatsDto> days = new ArrayList<>();
        dayMap.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .forEach(e -> days.add(new DailyStatsDto(
                e.getKey(),
                e.getValue()[0],
                e.getValue()[1],
                e.getValue()[2],
                e.getValue()[3]
            )));

        return new DailyStatsDto.Response(warehouseId, warehouse.getName(), year, month, days);
    }
}
