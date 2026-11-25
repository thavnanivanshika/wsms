package com.wsms.dto;

import com.wsms.model.User;

public record UserSummaryDto(
        Long id,
        String username,
        String email,
        String department,
        String role
) {
    public static UserSummaryDto from(User u) {
        return new UserSummaryDto(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getDepartment() != null ? u.getDepartment().getName() : null,
                u.getRole().getName()
        );
    }
}
