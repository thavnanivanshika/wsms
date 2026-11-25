package com.wsms.dto;

import java.math.BigDecimal;
import java.util.List;

/** Management report: cost incurred per item (approved requests), with head counts and totals. */
public record ReportDto(
        List<Line> lines,
        BigDecimal cumulativeCost,
        int totalHeadCount
) {
    /** One line per stationery item. */
    public record Line(
            Long itemId,
            String itemName,
            int totalQuantity,
            int headCount,
            BigDecimal costIncurred,
            BigDecimal percentOfTotal
    ) {
    }
}
