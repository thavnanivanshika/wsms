package com.wsms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "stationery_items")
public class StationeryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(nullable = false)
    private int availableQuantity;

    @Column(nullable = false)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    /** Minimum role required to see/request this item (role-based availability). */
    @ManyToOne(optional = false)
    @JoinColumn(name = "min_role_id")
    private Role minRole;

    public StationeryItem() {
    }

    public StationeryItem(String name, String description, int availableQuantity,
                          BigDecimal unitCost, Category category, Role minRole) {
        this.name = name;
        this.description = description;
        this.availableQuantity = availableQuantity;
        this.unitCost = unitCost;
        this.category = category;
        this.minRole = minRole;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(int availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Role getMinRole() {
        return minRole;
    }

    public void setMinRole(Role minRole) {
        this.minRole = minRole;
    }
}
