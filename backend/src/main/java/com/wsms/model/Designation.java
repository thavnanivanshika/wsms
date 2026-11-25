package com.wsms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * A designation in the institutional hierarchy (Lecturer, Professor, HoD, Dean, Principal).
 * {@code rank} orders the hierarchy; {@code maxPurchaseValue} is the eligibility cap.
 */
@Entity
@Table(name = "designations")
public class Designation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String title;

    /** Hierarchy level: higher rank = more senior. */
    @Column(nullable = false)
    private int rank;

    @Column(nullable = false)
    private BigDecimal maxPurchaseValue = BigDecimal.ZERO;

    public Designation() {
    }

    public Designation(String title, int rank, BigDecimal maxPurchaseValue) {
        this.title = title;
        this.rank = rank;
        this.maxPurchaseValue = maxPurchaseValue;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public BigDecimal getMaxPurchaseValue() {
        return maxPurchaseValue;
    }

    public void setMaxPurchaseValue(BigDecimal maxPurchaseValue) {
        this.maxPurchaseValue = maxPurchaseValue;
    }
}
