package com.wsms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Submit a stationery request: one or more item lines. */
public class CreateRequestDto {

    @NotEmpty(message = "At least one item line is required")
    @Size(max = 10, message = "A request may contain at most 10 item lines")
    @Valid
    private List<Line> lines;

    public static class Line {
        @NotNull(message = "Item must be selected")
        private Long itemId;

        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 100, message = "Quantity must not exceed 100")
        private int quantity;

        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }

    public List<Line> getLines() { return lines; }
    public void setLines(List<Line> lines) { this.lines = lines; }
}
