package com.example.warehousemanager.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Warehouse {
    @Id @GeneratedValue
    private Long id;

    private String name;
    private String address;
    private String phone;

    public Warehouse(Long id) {
        this.id = id;
    }
}
