package com.example.warehousemanager.controller;

import com.example.warehousemanager.dto.CreateOrderRequest;
import com.example.warehousemanager.dto.OrderDto;
import com.example.warehousemanager.service.OrderService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderDto>> getMyOrders(
        @RequestParam(name = "role", defaultValue = "buyer") String role
    ) {
        return ResponseEntity.ok(orderService.getMyOrders(role));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(@RequestBody CreateOrderRequest req) {
        return ResponseEntity.ok(orderService.createOrder(req));
    }

    @PostMapping("/{id}/seller-confirm")
    public ResponseEntity<OrderDto> sellerConfirm(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.sellerConfirm(id));
    }

    @PostMapping("/{id}/buyer-received")
    public ResponseEntity<OrderDto> buyerReceived(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.buyerReceived(id));
    }

    @PostMapping("/{id}/seller-confirm-payment")
    public ResponseEntity<OrderDto> sellerConfirmPayment(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.sellerConfirmPayment(id));
    }
}
