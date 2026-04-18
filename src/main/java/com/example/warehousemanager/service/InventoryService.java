package com.example.warehousemanager.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.warehousemanager.repository.StockRepository;
import com.example.warehousemanager.repository.StockTransactionRepository;
import com.example.warehousemanager.repository.UserWarehouseRepository;
import com.example.warehousemanager.entity.Stock;
import com.example.warehousemanager.entity.Warehouse;
import com.example.warehousemanager.entity.Product;
import com.example.warehousemanager.entity.StockTransaction;
import com.example.warehousemanager.dto.InventoryRequest;
import com.example.warehousemanager.dto.StockLevelDto;
import com.example.warehousemanager.dto.WarehouseStockLineDto;
import com.example.warehousemanager.dto.SetStockQuantityRequest;
import com.example.warehousemanager.dto.ListingUpdateRequest;
import com.example.warehousemanager.security.CurrentUserService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final StockRepository stockRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final UserWarehouseRepository userWarehouseRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public void addStock(Long productId, Long warehouseId, int quantity) {
        assertWarehouseAccess(warehouseId);
        doAddStock(productId, warehouseId, quantity);
    }

    @Transactional
    public void addStocks(Long warehouseId, List<InventoryRequest> requests) {
        assertWarehouseAccess(warehouseId);
        for (InventoryRequest request : requests) {
            doAddStock(request.getProductId(), warehouseId, request.getQuantity());
        }
    }

    private void doAddStock(Long productId, Long warehouseId, int quantity) {
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
        assertWarehouseAccess(warehouseId);
        doRemoveStock(productId, warehouseId, quantity);
    }

    @Transactional
    public void removeStocks(Long warehouseId, List<InventoryRequest> requests) {
        assertWarehouseAccess(warehouseId);
        for (InventoryRequest request : requests) {
            doRemoveStock(request.getProductId(), warehouseId, request.getQuantity());
        }
    }

    private void doRemoveStock(Long productId, Long warehouseId, int quantity) {
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
    @Transactional
    public void transfer(Long productId, Long fromWarehouse, Long toWarehouse, int quantity) {
        assertWarehouseAccess(fromWarehouse);
        assertWarehouseAccess(toWarehouse);

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

    private void assertWarehouseAccess(Long warehouseId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        boolean hasAccess = userWarehouseRepository.existsByUserIdAndWarehouseId(currentUserId, warehouseId);
        if (!hasAccess) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this warehouse");
        }
    }

    @Transactional
    public void removeProductLineFromWarehouse(Long warehouseId, Long productId) {
        assertWarehouseAccess(warehouseId);
        Stock stock = stockRepository
            .findByWarehouseIdAndProductId(warehouseId, productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không có dòng tồn kho này"));
        int qty = stock.getQuantity() != null ? stock.getQuantity() : 0;
        stockRepository.delete(stock);
        StockTransaction tx = new StockTransaction();
        tx.setProduct(new Product(productId));
        tx.setQuantity(qty);
        tx.setType("REMOVAL");
        tx.setWarehouseId(warehouseId);
        tx.setCreatedAt(LocalDateTime.now());
        stockTransactionRepository.save(tx);
    }

    public List<WarehouseStockLineDto> getWarehouseStocks(Long warehouseId) {
        assertWarehouseAccess(warehouseId);
        return stockRepository.listLinesForWarehouse(warehouseId).stream()
            .map(p -> new WarehouseStockLineDto(
                p.getProductId(),
                p.getProductName() != null ? p.getProductName() : "",
                p.getSku() != null ? p.getSku() : "",
                p.getQuantity() != null ? p.getQuantity() : 0,
                Boolean.TRUE.equals(p.getForSale()),
                p.getSalePrice() != null ? p.getSalePrice() : 0L
            ))
            .toList();
    }

    @Transactional
    public void setStockQuantity(Long warehouseId, SetStockQuantityRequest req) {
        assertWarehouseAccess(warehouseId);
        Long productId = req.getProductId();
        int newQuantity = req.getQuantity();
        if (productId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "productId is required");
        }
        if (newQuantity < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quantity cannot be negative");
        }

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

        int oldQuantity = stock.getQuantity() != null ? stock.getQuantity() : 0;
        int delta = newQuantity - oldQuantity;
        stock.setQuantity(newQuantity);
        stockRepository.save(stock);

        if (delta != 0) {
            StockTransaction tx = new StockTransaction();
            tx.setProduct(new Product(productId));
            tx.setQuantity(delta);
            tx.setType("ADJUSTMENT");
            tx.setWarehouseId(warehouseId);
            tx.setCreatedAt(LocalDateTime.now());
            stockTransactionRepository.save(tx);
        }
    }

    @Transactional
    public void updateListing(Long warehouseId, ListingUpdateRequest req) {
        assertWarehouseAccess(warehouseId);
        if (req.getProductId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "productId is required");
        }
        Stock stock = stockRepository
            .findByWarehouseIdAndProductId(warehouseId, req.getProductId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Stock line not found"));
        if (req.getForSale() != null) {
            stock.setForSale(req.getForSale());
        }
        if (req.getUnitPrice() != null) {
            if (req.getUnitPrice() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "unitPrice must be >= 0");
            }
            stock.setSalePrice(req.getUnitPrice());
        }
        stockRepository.save(stock);
    }

    public List<StockLevelDto> getLowStock(int threshold) {
        Long currentUserId = currentUserService.getCurrentUserId();
        Set<Long> warehouseIds = userWarehouseRepository.findByUserId(currentUserId)
            .stream()
            .map(uw -> uw.getWarehouse().getId())
            .collect(Collectors.toSet());
        if (warehouseIds.isEmpty()) {
            return List.of();
        }
        return stockRepository.findLowStock(warehouseIds, threshold).stream()
            .map(s -> new StockLevelDto(
                s.getWarehouse().getId(),
                s.getWarehouse().getName(),
                s.getProduct().getId(),
                s.getProduct().getName(),
                s.getQuantity()
            ))
            .toList();
    }
}
