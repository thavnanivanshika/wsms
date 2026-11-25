package com.wsms.dto;

import com.wsms.model.User;

import java.math.BigDecimal;

/** Returned after successful login/registration. */
public record AuthResponse(
        String token,
        String username,
        String email,
        String role,
        String designation,
        String department,
        BigDecimal maxPurchaseValue
) {
    public static AuthResponse of(String token, User u) {
        return new AuthResponse(
                token,
                u.getUsername(),
                u.getEmail(),
                u.getRole().getName(),
                u.getDesignation() != null ? u.getDesignation().getTitle() : null,
                u.getDepartment() != null ? u.getDepartment().getName() : null,
                u.getMaxPurchaseValue());
    }
}
