package com.example.warehousemanager.service;

import com.example.warehousemanager.bankqr.OpenCvQrDecoder;
import com.example.warehousemanager.entity.User;
import com.example.warehousemanager.repository.UserRepository;
import com.example.warehousemanager.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserBankQrService {
    private static final Logger log = LoggerFactory.getLogger(UserBankQrService.class);
    private static final int MAX_PAYLOAD_CHARS = 4096;

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final OpenCvQrDecoder openCvQrDecoder;

    @Transactional
    public void saveBankQrFromUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing image file");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded file");
        }
        if (bytes.length > 6 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image too large (max 6MB)");
        }
        Long uid = currentUserService.getCurrentUserId();
        log.info("Bank QR upload received: userId={}, bytes={}", uid, bytes.length);
        String decoded = openCvQrDecoder.decodeFirstQr(bytes)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Không đọc được mã QR trong ảnh. Hãy chụp/ chọn ảnh rõ, QR đủ trong khung hình."
            ));
        if (decoded.length() > MAX_PAYLOAD_CHARS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "QR content too long");
        }
        User user = userRepository.findById(uid)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        user.setBankQrPayload(decoded);
        userRepository.save(user);
    }
}
