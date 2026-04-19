package com.example.warehousemanager.controller;

import com.example.warehousemanager.dto.UserBriefDto;
import com.example.warehousemanager.dto.UserProfileDto;
import com.example.warehousemanager.entity.User;
import com.example.warehousemanager.repository.UserRepository;
import com.example.warehousemanager.security.CurrentUserService;
import com.example.warehousemanager.service.UserBankQrService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final UserBankQrService userBankQrService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> currentProfile() {
        Long id = currentUserService.getCurrentUserId();
        User u = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        boolean has = u.getBankQrPayload() != null && !u.getBankQrPayload().isBlank();
        return ResponseEntity.ok(new UserProfileDto(u.getUsername(), has));
    }

    @PostMapping("/me/bank-qr")
    public ResponseEntity<UserProfileDto> uploadBankQr(@RequestParam("file") MultipartFile file) {
        userBankQrService.saveBankQrFromUpload(file);
        return currentProfile();
    }

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
