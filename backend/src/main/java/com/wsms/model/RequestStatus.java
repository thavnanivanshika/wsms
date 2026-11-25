package com.wsms.model;

/**
 * Lifecycle of a stationery request.
 *
 * SUBMITTED  -> APPROVED | REJECTED | WITHDRAWN
 * APPROVED   -> CANCEL_REQUESTED
 * CANCEL_REQUESTED -> CANCELLED | APPROVED (if manager rejects the cancellation)
 */
public enum RequestStatus {
    SUBMITTED,
    APPROVED,
    REJECTED,
    WITHDRAWN,
    CANCEL_REQUESTED,
    CANCELLED
}
