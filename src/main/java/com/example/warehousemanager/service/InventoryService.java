package com.example.warehousemanager.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.repository.StockRepository;
import com.example.warehousemanager.repository.StockTransactionRepository;
import com.example.warehousemanager.entity.Stock;
import com.example.warehousemanager.entity.Warehouse;
import com.example.warehousemanager.entity.Product;
import com.example.warehousemanager.entity.StockTransaction;
import java.time.LocalDateTime;

import jakarta.transaction.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {
    @Transactional
    public void addStock(Long productId, Long warehouseId, int quantity) {
        Stock stock = stockRepository
            .findByWarehouseIdAndProductId(warehouseId, productId)
            .orElseGet(() -> {
                Stock s = new Stock();
    
                Warehouse w = new Warehouse();
                w.setId(warehouseId);
    
                Product p = new Product();
                p.setId(productId);
    
                s.setWarehouse(w);
                s.setProduct(p);
                s.setQuantity(0);
    
                return s;
            });
    
        stock.setQuantity(stock.getQuantity() + quantity);
    
        stockRepository.save(stock);
        StockTransaction tx = new StockTransaction();
        tx.setProduct(new Product(productId));
        tx.setQuantity(quantity);
        tx.setType("IMPORT");
        tx.setWarehouseId(warehouseId);
        tx.setCreatedAt(LocalDateTime.now());
        stockTransactionRepository.save(tx);
    }

    @Transactional
    public void removeStock(Long productId, Long warehouseId, int quantity) {
        Stock stock = stockRepository.findByWarehouseIdAndProductId(warehouseId, productId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy stock"));
        if (stock.getQuantity() < quantity) {
            throw new RuntimeException("Không đủ hàng");
        }
        stock.setQuantity(stock.getQuantity() - quantity);
        stockRepository.save(stock);
        StockTransaction tx = new StockTransaction();
        tx.setProduct(new Product(productId));
        tx.setQuantity(quantity);
        tx.setType("EXPORT");
        tx.setWarehouseId(warehouseId);
        tx.setCreatedAt(LocalDateTime.now());
        stockTransactionRepository.save(tx);
    }
    private final StockRepository stockRepository;
    private final StockTransactionRepository stockTransactionRepository;

    @Transactional
    public void transfer(Long productId, Long fromWarehouse, Long toWarehouse, int quantity) {

        Stock fromStock = stockRepository
            .findByWarehouseIdAndProductId(fromWarehouse, productId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy stock"));

        if (fromStock.getQuantity() < quantity) {
            throw new RuntimeException("Không đủ hàng");
        }

        // Trừ kho nguồn
        fromStock.setQuantity(fromStock.getQuantity() - quantity);

        // Cộng kho đích
        Stock toStock = stockRepository
            .findByWarehouseIdAndProductId(toWarehouse, productId)
            .orElseGet(() -> {
                Stock s = new Stock();
                Warehouse w = new Warehouse();
                w.setId(toWarehouse);
                w.setName("Kho đích");
                s.setWarehouse(w);
                Product p = new Product();
                p.setId(productId);
                p.setName("Sản phẩm");
                p.setSku("SKU123");
                s.setProduct(p);
                s.setQuantity(0);
                return s;
            });

        toStock.setQuantity(toStock.getQuantity() + quantity);

        stockRepository.save(fromStock);
        stockRepository.save(toStock);

        // Ghi transaction
        StockTransaction tx = new StockTransaction();
        tx.setProduct(new Product(productId));
        tx.setQuantity(quantity);
        tx.setType("TRANSFER");
        tx.setFromWarehouseId(fromWarehouse);
        tx.setToWarehouseId(toWarehouse);
        tx.setCreatedAt(LocalDateTime.now());

        stockTransactionRepository.save(tx);
    }
}
