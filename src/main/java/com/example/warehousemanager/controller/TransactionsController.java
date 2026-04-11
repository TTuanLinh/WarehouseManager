package com.example.warehousemanager.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.service.TransactionsService;
import com.example.warehousemanager.entity.StockTransaction;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionsController {

    private final TransactionsService transactionsService;

    @GetMapping
    public ResponseEntity<Page<StockTransaction>> getTransactions(
        @RequestParam(required = false) Long productId,
        @RequestParam(required = false) Long warehouseId,
        @PageableDefault(size = 50) Pageable pageable
    ) {
        return ResponseEntity.ok(transactionsService.getTransactions(productId, warehouseId, pageable));
    }

}
