package com.example.warehousemanager.controller;

import com.example.warehousemanager.dto.MarketplaceListingDto;
import com.example.warehousemanager.service.MarketplaceService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
public class MarketplaceController {
    private final MarketplaceService marketplaceService;

    @GetMapping("/{sellerId}/listings")
    public ResponseEntity<List<MarketplaceListingDto>> getSellerListings(
        @PathVariable Long sellerId,
        @RequestParam(name = "q", required = false) String query
    ) {
        return ResponseEntity.ok(marketplaceService.getSellerListings(sellerId, query));
    }
}
