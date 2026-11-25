package com.wsms.dto;

import com.wsms.model.StationeryItem;

import java.math.BigDecimal;

public record ItemDto(
        Long id,
        String name,
        String description,
        int availableQuantity,
        BigDecimal unitCost,
        String category,
        String minRole
) {
    public static ItemDto from(StationeryItem i) {
        return new ItemDto(i.getId(), i.getName(), i.getDescription(),
                i.getAvailableQuantity(), i.getUnitCost(),
                i.getCategory() != null ? i.getCategory().getName() : null,
                i.getMinRole() != null ? i.getMinRole().getName() : null);
    }
}
