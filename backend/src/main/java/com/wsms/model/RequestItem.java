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

/** A single line item of a {@link StationeryRequest}: one stationery item and a quantity. */
@Entity
@Table(name = "request_items")
public class RequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "request_id")
    private StationeryRequest request;

    @ManyToOne(optional = false)
    @JoinColumn(name = "item_id")
    private StationeryItem item;

    @Column(nullable = false)
    private int quantity;

    /** Unit cost captured at request time. */
    @Column(nullable = false)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal lineTotal = BigDecimal.ZERO;

    public RequestItem() {
    }

    public RequestItem(StationeryItem item, int quantity) {
        this.item = item;
        this.quantity = quantity;
        this.unitCost = item.getUnitCost();
        this.lineTotal = item.getUnitCost().multiply(BigDecimal.valueOf(quantity));
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public StationeryRequest getRequest() {
        return request;
    }

    public void setRequest(StationeryRequest request) {
        this.request = request;
    }

    public StationeryItem getItem() {
        return item;
    }

    public void setItem(StationeryItem item) {
        this.item = item;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }
}
