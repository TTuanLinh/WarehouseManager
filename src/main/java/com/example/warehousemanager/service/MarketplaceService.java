package com.example.warehousemanager.service;

import com.example.warehousemanager.dto.MarketplaceListingDto;
import com.example.warehousemanager.repository.StockRepository;
import com.example.warehousemanager.repository.UserRepository;
import com.example.warehousemanager.repository.UserWarehouseRepository;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MarketplaceService {
    private final UserWarehouseRepository userWarehouseRepository;
    private final StockRepository stockRepository;
    private final UserRepository userRepository;

    public List<MarketplaceListingDto> getSellerListings(Long sellerId, String search) {
        Set<Long> sellerWarehouseIds = userWarehouseRepository.findByUserId(sellerId)
            .stream()
            .map(uw -> uw.getWarehouse().getId())
            .collect(Collectors.toSet());
        if (sellerWarehouseIds.isEmpty()) {
            return List.of();
        }

        String sellerUsername = userRepository.findById(sellerId).map(u -> u.getUsername()).orElse("unknown");
        String q = normalizeSearch(search);
        return stockRepository.findSellableStocks(sellerWarehouseIds).stream()
            .filter(s -> {
                if (q == null) return true;
                String name = s.getProduct().getName() != null ? s.getProduct().getName().toLowerCase() : "";
                String sku = s.getProduct().getSku() != null ? s.getProduct().getSku().toLowerCase() : "";
                return name.contains(q) || sku.contains(q);
            })
            .map(s -> new MarketplaceListingDto(
                s.getWarehouse().getId(),
                s.getWarehouse().getName(),
                s.getWarehouse().getAddress(),
                s.getProduct().getId(),
                s.getProduct().getName(),
                s.getProduct().getSku(),
                s.getQuantity(),
                s.getSalePrice() != null ? s.getSalePrice() : 0L,
                sellerId,
                sellerUsername
            ))
            .toList();
    }

    private String normalizeSearch(String raw) {
        if (raw == null || raw.isBlank()) return null;
        return raw.trim().toLowerCase();
    }
}
