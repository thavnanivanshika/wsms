package com.wsms.dto;

import jakarta.validation.constraints.Size;

/** Optional comments for a manager decision (approve/reject/cancel). */
public class DecisionDto {

    @Size(max = 500, message = "Comments must not exceed 500 characters")
    private String comments;

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }
}
