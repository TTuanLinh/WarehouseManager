package com.example.warehousemanager.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.repository.StockTransactionRepository;
import com.example.warehousemanager.entity.StockTransaction;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionsService {

    private final StockTransactionRepository stockTransactionRepository;

    public List<StockTransaction> getAllTransactions() {
        return stockTransactionRepository.findAll();
    }

}
