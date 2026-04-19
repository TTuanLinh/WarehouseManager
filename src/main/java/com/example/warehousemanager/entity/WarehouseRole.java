package com.example.warehousemanager.entity;

public enum WarehouseRole {
    ADMIN,
    STAFF;

    public static WarehouseRole fromString(String raw) {
        if (raw == null || raw.isBlank()) {
            return ADMIN;
        }
        try {
            return WarehouseRole.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("role must be ADMIN or STAFF");
        }
    }

    public static boolean isAdmin(String role) {
        if (role == null || role.isBlank()) {
            return true;
        }
        return ADMIN.name().equalsIgnoreCase(role.trim());
    }

    public static boolean isStaff(String role) {
        return STAFF.name().equalsIgnoreCase(role == null ? "" : role.trim());
    }
}
