package com.wsms.controller;

import com.wsms.dto.CreateRequestDto;
import com.wsms.dto.RequestDto;
import com.wsms.service.CurrentUserProvider;
import com.wsms.service.RequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    private final RequestService requestService;
    private final CurrentUserProvider currentUser;

    public RequestController(RequestService requestService, CurrentUserProvider currentUser) {
        this.requestService = requestService;
        this.currentUser = currentUser;
    }

    /** Apply for a new stationery request. */
    @PostMapping
    public RequestDto create(@Valid @RequestBody CreateRequestDto dto) {
        return requestService.create(currentUser.require(), dto);
    }

    /** The caller's own requests and their statuses. */
    @GetMapping("/my")
    public List<RequestDto> myRequests() {
        return requestService.myRequests(currentUser.require());
    }

    /** Withdraw a request that has not yet been approved. */
    @PostMapping("/{id}/withdraw")
    public RequestDto withdraw(@PathVariable Long id) {
        return requestService.withdraw(currentUser.require(), id);
    }

    /** Request cancellation of an already-approved request (needs manager approval). */
    @PostMapping("/{id}/cancel")
    public RequestDto cancel(@PathVariable Long id) {
        return requestService.requestCancellation(currentUser.require(), id);
    }
}
