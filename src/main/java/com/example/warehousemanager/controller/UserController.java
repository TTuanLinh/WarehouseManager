package com.example.warehousemanager.controller;

import com.example.warehousemanager.dto.UserBriefDto;
import com.example.warehousemanager.repository.UserRepository;
import com.example.warehousemanager.security.CurrentUserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    @GetMapping("/search")
    public ResponseEntity<List<UserBriefDto>> searchUsers(@RequestParam("query") String query) {
        Long current = currentUserService.getCurrentUserId();
        List<UserBriefDto> users = userRepository.searchByUsername(query).stream()
            .filter(u -> !u.getId().equals(current))
            .limit(20)
            .map(u -> new UserBriefDto(u.getId(), u.getUsername()))
            .toList();
        return ResponseEntity.ok(users);
    }
}
