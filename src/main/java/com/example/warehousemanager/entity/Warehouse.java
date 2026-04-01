package com.example.warehousemanager.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class Warehouse {
    @Id @GeneratedValue
    private Long id;

    private String name;
}
