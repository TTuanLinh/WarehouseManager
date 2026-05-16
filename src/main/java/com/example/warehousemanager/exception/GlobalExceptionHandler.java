package com.example.warehousemanager.exception;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Bắt lỗi validation (MethodArgumentNotValidException) từ @Valid
 * và trả về JSON có cấu trúc rõ ràng cho frontend.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex) {

        List<Map<String, String>> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> {
                    Map<String, String> error = new LinkedHashMap<>();
                    error.put("field", fe.getField());
                    error.put("message", fe.getDefaultMessage() != null
                            ? fe.getDefaultMessage()
                            : "Giá trị không hợp lệ");
                    return error;
                })
                .collect(Collectors.toList());

        // Nối tất cả message lại thành 1 chuỗi — frontend đọc trường "message" này
        String combinedMessage = fieldErrors.stream()
                .map(e -> e.get("message"))
                .collect(Collectors.joining("; "));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", combinedMessage);
        body.put("errors", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(
            org.springframework.web.server.ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getReason() != null ? ex.getReason() : "Yêu cầu không hợp lệ");
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }
}
