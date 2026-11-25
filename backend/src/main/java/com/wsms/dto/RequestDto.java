package com.wsms.dto;

import com.wsms.model.StationeryRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record RequestDto(
        Long id,
        String requestorUsername,
        String requestorEmail,
        String department,
        String designation,
        List<LineDto> lines,
        BigDecimal totalCost,
        String status,
        String approverUsername,
        String comments,
        Instant createdAt,
        Instant decidedAt
) {
    public static RequestDto from(StationeryRequest r) {
        return new RequestDto(
                r.getId(),
                r.getRequestor().getUsername(),
                r.getRequestor().getEmail(),
                r.getRequestor().getDepartment() != null ? r.getRequestor().getDepartment().getName() : null,
                r.getRequestor().getDesignation() != null ? r.getRequestor().getDesignation().getTitle() : null,
                r.getItems().stream().map(LineDto::from).toList(),
                r.getTotalCost(),
                r.getStatus().name(),
                r.getApprover() != null ? r.getApprover().getUsername() : null,
                r.getComments(),
                r.getCreatedAt(),
                r.getDecidedAt()
        );
    }
}
