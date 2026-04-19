package com.example.warehousemanager.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Lightweight runtime schema patches for local/dev databases.
 * Keeps old databases compatible when new columns are introduced.
 */
@Component
@RequiredArgsConstructor
public class SchemaPatchRunner implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("ALTER TABLE customer_order ADD COLUMN IF NOT EXISTS destination_warehouse_id BIGINT");
        jdbcTemplate.execute("ALTER TABLE customer_order ADD COLUMN IF NOT EXISTS destination_warehouse_name VARCHAR(255)");
        jdbcTemplate.execute("ALTER TABLE customer_order ADD COLUMN IF NOT EXISTS recipient_address VARCHAR(1000)");
        jdbcTemplate.execute("ALTER TABLE customer_order ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(64)");
        jdbcTemplate.execute("ALTER TABLE warehouse ADD COLUMN IF NOT EXISTS address VARCHAR(1000)");
        jdbcTemplate.execute("ALTER TABLE warehouse ADD COLUMN IF NOT EXISTS phone VARCHAR(64)");
        jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_qr_payload TEXT");
        jdbcTemplate.execute("ALTER TABLE user_warehouse ADD COLUMN IF NOT EXISTS role VARCHAR(32)");
        jdbcTemplate.execute("UPDATE user_warehouse SET role = 'ADMIN' WHERE role IS NULL OR TRIM(role) = ''");
    }
}
