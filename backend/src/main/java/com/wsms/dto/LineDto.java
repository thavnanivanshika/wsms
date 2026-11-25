package com.wsms.dto;

import com.wsms.model.RequestItem;

import java.math.BigDecimal;

public record LineDto(
        Long itemId,
        String itemName,
        int quantity,
        BigDecimal unitCost,
        BigDecimal lineTotal
) {
    public static LineDto from(RequestItem ri) {
        return new LineDto(ri.getItem().getId(), ri.getItem().getName(),
                ri.getQuantity(), ri.getUnitCost(), ri.getLineTotal());
    }
}
