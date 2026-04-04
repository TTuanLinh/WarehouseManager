package com.example.warehousemanager.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.service.TransactionsService;
import com.example.warehousemanager.entity.StockTransaction;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionsController {

    private final TransactionsService transactionsService;

    @GetMapping
    public ResponseEntity<List<StockTransaction>> getAllTransactions() {
        List<StockTransaction> transactions = transactionsService.getAllTransactions();
        return ResponseEntity.ok(transactions);
    }

}
