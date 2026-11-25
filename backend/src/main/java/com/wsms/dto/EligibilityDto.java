package com.wsms.dto;

import com.wsms.model.User;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/** The current user's eligibility: cap, committed spend, remaining, and last reset date. */
public record EligibilityDto(
        String role,
        BigDecimal maxPurchaseValue,
        BigDecimal committedValue,
        BigDecimal remainingValue,
        String spendResetAt
) {
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a").withZone(ZoneId.systemDefault());

    public static EligibilityDto of(User u, BigDecimal committed, BigDecimal remaining) {
        String resetAt = u.getEligibilityResetAt() != null ? FMT.format(u.getEligibilityResetAt()) : null;
        return new EligibilityDto(
                u.getRole().getName(),
                u.getMaxPurchaseValue(), committed, remaining, resetAt);
    }
}
