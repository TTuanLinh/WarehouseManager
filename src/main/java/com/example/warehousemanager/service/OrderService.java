package com.example.warehousemanager.service;

import com.example.warehousemanager.dto.CreateOrderRequest;
import com.example.warehousemanager.dto.OrderDto;
import com.example.warehousemanager.dto.OrderItemDto;
import com.example.warehousemanager.entity.CustomerOrder;
import com.example.warehousemanager.entity.CustomerOrderItem;
import com.example.warehousemanager.entity.OrderStatus;
import com.example.warehousemanager.entity.Product;
import com.example.warehousemanager.entity.Stock;
import com.example.warehousemanager.entity.StockTransaction;
import com.example.warehousemanager.entity.User;
import com.example.warehousemanager.entity.Warehouse;
import com.example.warehousemanager.repository.CustomerOrderItemRepository;
import com.example.warehousemanager.repository.CustomerOrderRepository;
import com.example.warehousemanager.repository.StockRepository;
import com.example.warehousemanager.repository.StockTransactionRepository;
import com.example.warehousemanager.repository.UserRepository;
import com.example.warehousemanager.repository.UserWarehouseRepository;
import com.example.warehousemanager.repository.WarehouseRepository;
import com.example.warehousemanager.security.CurrentUserService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final CustomerOrderRepository orderRepository;
    private final CustomerOrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final UserWarehouseRepository userWarehouseRepository;
    private final WarehouseRepository warehouseRepository;
    private final StockRepository stockRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final CurrentUserService currentUserService;

    public List<OrderDto> getMyOrders(String role) {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<CustomerOrder> orders = "seller".equalsIgnoreCase(role)
            ? orderRepository.findBySeller(currentUserId)
            : orderRepository.findByBuyer(currentUserId);
        return orders.stream().map(this::toDto).toList();
    }

    public OrderDto getOrder(Long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        assertOrderVisible(order);
        return toDto(order);
    }

    @Transactional
    public OrderDto createOrder(CreateOrderRequest req) {
        Long buyerId = currentUserService.getCurrentUserId();
        if (req.getSellerId() == null || req.getDestinationWarehouseId() == null || req.getItems() == null || req.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sellerId, destinationWarehouseId and items are required");
        }
        if (buyerId.equals(req.getSellerId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot order from yourself");
        }
        User buyer = userRepository.findById(buyerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Buyer not found"));
        User seller = userRepository.findById(req.getSellerId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seller not found"));
        boolean buyerOwnsDestinationWarehouse = userWarehouseRepository.existsByUserIdAndWarehouseId(buyerId, req.getDestinationWarehouseId());
        if (!buyerOwnsDestinationWarehouse) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to destination warehouse");
        }
        Warehouse destination = warehouseRepository.findById(req.getDestinationWarehouseId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Destination warehouse not found"));

        CustomerOrder order = new CustomerOrder();
        order.setBuyer(buyer);
        order.setSeller(seller);
        order.setDestinationWarehouseId(destination.getId());
        order.setDestinationWarehouseName(destination.getName());
        order.setRecipientAddress(destination.getAddress());
        order.setRecipientPhone(destination.getPhone());
        order.setStatus(OrderStatus.PENDING_SELLER_CONFIRM);
        order.setNote(req.getNote());
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        long total = 0L;
        for (CreateOrderRequest.CreateOrderItem it : req.getItems()) {
            if (it.getWarehouseId() == null || it.getProductId() == null || it.getQuantity() == null || it.getQuantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order item");
            }
            boolean sellerHasWarehouse = userWarehouseRepository.existsByUserIdAndWarehouseId(seller.getId(), it.getWarehouseId());
            if (!sellerHasWarehouse) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seller does not manage source warehouse");
            }

            Stock stock = stockRepository.findByWarehouseIdAndProductId(it.getWarehouseId(), it.getProductId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stock line not found"));
            if (!Boolean.TRUE.equals(stock.getForSale())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product is not for sale");
            }
            if (stock.getSalePrice() == null || stock.getSalePrice() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sale price");
            }
            if (stock.getQuantity() < it.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient stock quantity");
            }

            CustomerOrderItem oi = new CustomerOrderItem();
            oi.setOrder(order);
            oi.setProduct(stock.getProduct());
            oi.setSourceWarehouseId(it.getWarehouseId());
            oi.setProductNameSnapshot(stock.getProduct().getName());
            oi.setSkuSnapshot(stock.getProduct().getSku());
            oi.setUnitPrice(stock.getSalePrice());
            oi.setQuantity(it.getQuantity());
            orderItemRepository.save(oi);
            total += stock.getSalePrice() * it.getQuantity();
        }

        order.setTotalAmount(total);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        return toDto(order);
    }

    @Transactional
    public OrderDto sellerConfirm(Long orderId) {
        CustomerOrder order = mustLoad(orderId);
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!order.getSeller().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only seller can confirm");
        }
        if (order.getStatus() != OrderStatus.PENDING_SELLER_CONFIRM) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not pending seller confirm");
        }

        List<CustomerOrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (CustomerOrderItem item : items) {
            Stock stock = stockRepository.findByWarehouseIdAndProductId(item.getSourceWarehouseId(), item.getProduct().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stock line not found"));
            if (stock.getQuantity() < item.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient stock during confirm");
            }
            stock.setQuantity(stock.getQuantity() - item.getQuantity());
            stockRepository.save(stock);

            StockTransaction tx = new StockTransaction();
            tx.setProduct(new Product(item.getProduct().getId()));
            tx.setQuantity(item.getQuantity());
            tx.setType("ORDER_EXPORT");
            tx.setWarehouseId(item.getSourceWarehouseId());
            tx.setCreatedAt(LocalDateTime.now());
            stockTransactionRepository.save(tx);
        }

        order.setStatus(OrderStatus.IN_TRANSIT);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        return toDto(order);
    }

    @Transactional
    public OrderDto buyerReceived(Long orderId) {
        CustomerOrder order = mustLoad(orderId);
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!order.getBuyer().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only buyer can confirm received");
        }
        if (order.getStatus() != OrderStatus.IN_TRANSIT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not in transit");
        }
        Long destinationWarehouseId = order.getDestinationWarehouseId();
        boolean hasAccess = userWarehouseRepository.existsByUserIdAndWarehouseId(currentUserId, destinationWarehouseId);
        if (!hasAccess) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to destination warehouse");
        }

        List<CustomerOrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (CustomerOrderItem item : items) {
            Stock dst = stockRepository.findByWarehouseIdAndProductId(destinationWarehouseId, item.getProduct().getId())
                .orElseGet(() -> {
                    Stock s = new Stock();
                    Warehouse w = new Warehouse();
                    w.setId(destinationWarehouseId);
                    s.setWarehouse(w);
                    s.setProduct(new Product(item.getProduct().getId()));
                    s.setQuantity(0);
                    s.setForSale(false);
                    return s;
                });
            dst.setQuantity(dst.getQuantity() + item.getQuantity());
            stockRepository.save(dst);

            StockTransaction tx = new StockTransaction();
            tx.setProduct(new Product(item.getProduct().getId()));
            tx.setQuantity(item.getQuantity());
            tx.setType("ORDER_IMPORT");
            tx.setWarehouseId(destinationWarehouseId);
            tx.setCreatedAt(LocalDateTime.now());
            stockTransactionRepository.save(tx);
        }

        order.setStatus(OrderStatus.AWAITING_PAYMENT);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        return toDto(order);
    }

    @Transactional
    public OrderDto sellerConfirmPayment(Long orderId) {
        CustomerOrder order = mustLoad(orderId);
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!order.getSeller().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only seller can confirm payment");
        }
        if (order.getStatus() != OrderStatus.AWAITING_PAYMENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not awaiting payment");
        }
        order.setStatus(OrderStatus.COMPLETED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        return toDto(order);
    }

    private CustomerOrder mustLoad(Long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        assertOrderVisible(order);
        return order;
    }

    private void assertOrderVisible(CustomerOrder order) {
        Long uid = currentUserService.getCurrentUserId();
        boolean visible = order.getBuyer().getId().equals(uid) || order.getSeller().getId().equals(uid);
        if (!visible) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this order");
        }
    }

    private OrderDto toDto(CustomerOrder order) {
        List<OrderItemDto> items = orderItemRepository.findByOrderId(order.getId()).stream()
            .map(i -> new OrderItemDto(
                i.getId(),
                i.getProduct().getId(),
                i.getProductNameSnapshot(),
                i.getSkuSnapshot(),
                i.getSourceWarehouseId(),
                i.getQuantity(),
                i.getUnitPrice()
            ))
            .toList();
        return new OrderDto(
            order.getId(),
            order.getBuyer().getId(),
            order.getBuyer().getUsername(),
            order.getSeller().getId(),
            order.getSeller().getUsername(),
            order.getDestinationWarehouseId(),
            order.getDestinationWarehouseName(),
            order.getRecipientAddress(),
            order.getRecipientPhone(),
            order.getStatus(),
            order.getTotalAmount(),
            order.getNote(),
            order.getCreatedAt(),
            items
        );
    }
}
