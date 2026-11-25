package com.wsms.service;

import com.wsms.dto.CreateRequestDto;
import com.wsms.dto.EligibilityDto;
import com.wsms.dto.RequestDto;
import com.wsms.exception.ApiException;
import com.wsms.model.RequestItem;
import com.wsms.model.RequestStatus;
import com.wsms.model.RequestStatusHistory;
import com.wsms.model.StationeryItem;
import com.wsms.model.StationeryRequest;
import com.wsms.model.User;
import com.wsms.repository.RequestStatusHistoryRepository;
import com.wsms.repository.StationeryItemRepository;
import com.wsms.repository.StationeryRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RequestService {

    private final StationeryRequestRepository requestRepository;
    private final StationeryItemRepository itemRepository;
    private final RequestStatusHistoryRepository historyRepository;
    private final ItemService itemService;
    private final EmailService emailService;

    public RequestService(StationeryRequestRepository requestRepository,
                          StationeryItemRepository itemRepository,
                          RequestStatusHistoryRepository historyRepository,
                          ItemService itemService,
                          EmailService emailService) {
        this.requestRepository = requestRepository;
        this.itemRepository = itemRepository;
        this.historyRepository = historyRepository;
        this.itemService = itemService;
        this.emailService = emailService;
    }

    // ----- Requestor actions -----

    @Transactional
    public RequestDto create(User requestor, CreateRequestDto dto) {
        if (dto.getLines() == null || dto.getLines().isEmpty()) {
            throw ApiException.badRequest("At least one item is required");
        }

        StationeryRequest req = new StationeryRequest();
        req.setRequestor(requestor);
        req.setStatus(RequestStatus.SUBMITTED);
        req.setCreatedAt(Instant.now());

        // Aggregate requested quantity per item so combined lines can't exceed stock.
        Map<Long, Integer> qtyByItem = new LinkedHashMap<>();
        for (CreateRequestDto.Line line : dto.getLines()) {
            qtyByItem.merge(line.getItemId(), line.getQuantity(), Integer::sum);
        }

        BigDecimal totalCost = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> e : qtyByItem.entrySet()) {
            StationeryItem item = itemRepository.findById(e.getKey())
                    .orElseThrow(() -> ApiException.notFound("Stationery item not found"));
            if (!requestor.getRole().isManager() && item.getMinRole().isManager()) {
                throw ApiException.forbidden("You are not eligible to request '" + item.getName() + "'");
            }
            int qty = e.getValue();
            if (qty > item.getAvailableQuantity()) {
                throw ApiException.badRequest("Requested quantity for '" + item.getName()
                        + "' exceeds available stock (" + item.getAvailableQuantity() + ")");
            }
            RequestItem ri = new RequestItem(item, qty);
            req.addItem(ri);
            totalCost = totalCost.add(ri.getLineTotal());
        }
        req.setTotalCost(totalCost);

        // Eligibility check against the requestor's remaining purchase value.
        EligibilityDto elig = itemService.eligibilityFor(requestor);
        if (totalCost.compareTo(elig.remainingValue()) > 0) {
            throw ApiException.badRequest("Request cost " + totalCost
                    + " exceeds your remaining eligibility of " + elig.remainingValue());
        }

        requestRepository.save(req);
        recordHistory(req, null, RequestStatus.SUBMITTED, requestor, "Request submitted");

        emailService.notify(req, requestor.getEmail(), null,
                "WSMS: Stationery request submitted (#" + req.getId() + ")",
                "Your stationery request has been submitted.\n\n" + describe(req) + "\nStatus: awaiting approval.");
        return RequestDto.from(req);
    }

    @Transactional(readOnly = true)
    public List<RequestDto> myRequests(User requestor) {
        return requestRepository.findByRequestorOrderByCreatedAtDesc(requestor)
                .stream().map(RequestDto::from).toList();
    }

    @Transactional
    public RequestDto withdraw(User requestor, Long id) {
        StationeryRequest req = ownedRequest(requestor, id);
        if (req.getStatus() != RequestStatus.SUBMITTED) {
            throw ApiException.conflict("Only a request awaiting approval can be withdrawn");
        }
        transition(req, RequestStatus.WITHDRAWN, requestor, "Withdrawn by requestor");
        emailService.notify(req, requestor.getEmail(), null,
                "WSMS: Stationery request withdrawn (#" + req.getId() + ")",
                "The following request has been withdrawn.\n\n" + describe(req));
        return RequestDto.from(req);
    }

    @Transactional
    public RequestDto requestCancellation(User requestor, Long id) {
        StationeryRequest req = ownedRequest(requestor, id);
        if (req.getStatus() != RequestStatus.APPROVED) {
            throw ApiException.conflict("Only an approved request can be cancelled");
        }
        transition(req, RequestStatus.CANCEL_REQUESTED, requestor, "Cancellation requested");
        emailService.notify(req, requestor.getEmail(), null,
                "WSMS: Cancellation requested (#" + req.getId() + ")",
                "A cancellation has been requested for an approved request.\n\n" + describe(req));
        return RequestDto.from(req);
    }

    // ----- Admin actions -----

    @Transactional(readOnly = true)
    public List<RequestDto> pendingForManager() {
        return requestRepository.findByStatusInOrderByCreatedAtDesc(
                        List.of(RequestStatus.SUBMITTED, RequestStatus.CANCEL_REQUESTED))
                .stream().map(RequestDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<RequestDto> allRequests() {
        return requestRepository.findAll(
                        org.springframework.data.domain.Sort.by(
                                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
                .stream().map(RequestDto::from).toList();
    }

    @Transactional
    public RequestDto approve(User admin, Long id, String comments) {
        StationeryRequest req = findRequest(id);
        if (req.getStatus() != RequestStatus.SUBMITTED) {
            throw ApiException.conflict("Only a submitted request can be approved");
        }
        for (RequestItem ri : req.getItems()) {
            StationeryItem item = ri.getItem();
            if (ri.getQuantity() > item.getAvailableQuantity()) {
                throw ApiException.conflict("Insufficient stock to approve '" + item.getName() + "'");
            }
        }
        for (RequestItem ri : req.getItems()) {
            StationeryItem item = ri.getItem();
            item.setAvailableQuantity(item.getAvailableQuantity() - ri.getQuantity());
            itemRepository.save(item);
        }
        req.setApprover(admin);
        req.setComments(comments);
        req.setDecidedAt(Instant.now());
        transition(req, RequestStatus.APPROVED, admin, comments);
        emailService.notify(req, req.getRequestor().getEmail(), null,
                "WSMS: Stationery request APPROVED (#" + req.getId() + ")",
                "Your stationery request has been approved.\n\n" + describe(req) + comment(comments));
        return RequestDto.from(req);
    }

    @Transactional
    public RequestDto reject(User admin, Long id, String comments) {
        StationeryRequest req = findRequest(id);
        if (req.getStatus() != RequestStatus.SUBMITTED) {
            throw ApiException.conflict("Only a submitted request can be rejected");
        }
        req.setApprover(admin);
        req.setComments(comments);
        req.setDecidedAt(Instant.now());
        transition(req, RequestStatus.REJECTED, admin, comments);
        emailService.notify(req, req.getRequestor().getEmail(), null,
                "WSMS: Stationery request REJECTED (#" + req.getId() + ")",
                "Your stationery request has been rejected.\n\n" + describe(req) + comment(comments));
        return RequestDto.from(req);
    }

    @Transactional
    public RequestDto confirmCancellation(User admin, Long id, String comments) {
        StationeryRequest req = findRequest(id);
        if (req.getStatus() != RequestStatus.CANCEL_REQUESTED) {
            throw ApiException.conflict("No pending cancellation for this request");
        }
        for (RequestItem ri : req.getItems()) {
            StationeryItem item = ri.getItem();
            item.setAvailableQuantity(item.getAvailableQuantity() + ri.getQuantity());
            itemRepository.save(item);
        }
        req.setApprover(admin);
        req.setComments(comments);
        req.setDecidedAt(Instant.now());
        transition(req, RequestStatus.CANCELLED, admin, comments);
        emailService.notify(req, req.getRequestor().getEmail(), null,
                "WSMS: Stationery request CANCELLED (#" + req.getId() + ")",
                "The cancellation of your approved request has been confirmed.\n\n" + describe(req) + comment(comments));
        return RequestDto.from(req);
    }

    // ----- helpers -----

    private void transition(StationeryRequest req, RequestStatus to, User by, String note) {
        RequestStatus from = req.getStatus();
        req.setStatus(to);
        requestRepository.save(req);
        recordHistory(req, from, to, by, note);
    }

    private void recordHistory(StationeryRequest req, RequestStatus from, RequestStatus to,
                               User by, String note) {
        historyRepository.save(new RequestStatusHistory(req, from, to, by, note));
    }

    private StationeryRequest findRequest(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Request not found"));
    }

    private StationeryRequest ownedRequest(User requestor, Long id) {
        StationeryRequest req = findRequest(id);
        if (!req.getRequestor().getId().equals(requestor.getId())) {
            throw ApiException.forbidden("This request does not belong to you");
        }
        return req;
    }

    private String describe(StationeryRequest r) {
        StringBuilder sb = new StringBuilder();
        sb.append("Request #").append(r.getId())
          .append("\nRequestor: ").append(r.getRequestor().getUsername())
          .append("\nItems:\n");
        for (RequestItem ri : r.getItems()) {
            sb.append("  - ").append(ri.getItem().getName())
              .append(" x").append(ri.getQuantity())
              .append(" = ").append(ri.getLineTotal()).append("\n");
        }
        sb.append("Total cost: ").append(r.getTotalCost()).append("\n");
        return sb.toString();
    }

    private String comment(String comments) {
        return (comments != null && !comments.isBlank()) ? "\nAdmin comments: " + comments : "";
    }
}
