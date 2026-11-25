package com.wsms.service;

import com.wsms.dto.CreateRequestDto;
import com.wsms.dto.EligibilityDto;
import com.wsms.exception.ApiException;
import com.wsms.model.Category;
import com.wsms.model.Department;
import com.wsms.model.Designation;
import com.wsms.model.RequestItem;
import com.wsms.model.RequestStatus;
import com.wsms.model.Role;
import com.wsms.model.StationeryItem;
import com.wsms.model.StationeryRequest;
import com.wsms.model.User;
import com.wsms.repository.RequestStatusHistoryRepository;
import com.wsms.repository.StationeryItemRepository;
import com.wsms.repository.StationeryRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RequestServiceTest {

    private StationeryRequestRepository requestRepo;
    private StationeryItemRepository itemRepo;
    private RequestStatusHistoryRepository historyRepo;
    private ItemService itemService;
    private EmailService emailService;
    private RequestService service;

    private Role roleUser;
    private Role roleManager;
    private User alice;
    private User boss;
    private StationeryItem paper;

    @BeforeEach
    void setUp() {
        requestRepo = mock(StationeryRequestRepository.class);
        itemRepo = mock(StationeryItemRepository.class);
        historyRepo = mock(RequestStatusHistoryRepository.class);
        itemService = mock(ItemService.class);
        emailService = mock(EmailService.class);
        service = new RequestService(requestRepo, itemRepo, historyRepo, itemService, emailService);

        roleUser = new Role(Role.USER, "user");
        roleManager = new Role(Role.MANAGER, "manager");
        Designation lecturer = new Designation("Lecturer", 1, new BigDecimal("5000"));
        Department dept = new Department("CSE", "CSE");

        boss = new User("boss", "boss@wsms.local", "x", roleManager, lecturer, dept, null);
        boss.setId(2L);
        alice = new User("alice", "alice@wsms.local", "x", roleUser, lecturer, dept, boss);
        alice.setId(1L);

        paper = new StationeryItem("Paper", "A4", 100, new BigDecimal("250.00"), new Category("Paper", ""), roleUser);
        paper.setId(10L);

        when(requestRepo.save(any(StationeryRequest.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private CreateRequestDto dto(int qty) {
        CreateRequestDto d = new CreateRequestDto();
        CreateRequestDto.Line line = new CreateRequestDto.Line();
        line.setItemId(10L);
        line.setQuantity(qty);
        d.setLines(List.of(line));
        return d;
    }

    private void eligibility(String remaining) {
        when(itemService.eligibilityFor(alice)).thenReturn(new EligibilityDto(
                "USER", new BigDecimal("5000"), BigDecimal.ZERO, new BigDecimal(remaining), null));
    }

    @Test
    void createsSubmittedRequestWithLineItems() {
        when(itemRepo.findById(10L)).thenReturn(Optional.of(paper));
        eligibility("5000");

        var result = service.create(alice, dto(4)); // 4 * 250 = 1000

        assertThat(result.status()).isEqualTo("SUBMITTED");
        assertThat(result.totalCost()).isEqualByComparingTo("1000.00");
        assertThat(result.lines()).hasSize(1);
        assertThat(result.lines().get(0).lineTotal()).isEqualByComparingTo("1000.00");
        verify(emailService).notify(any(StationeryRequest.class), any(), any(), any(), any());
        verify(historyRepo).save(any());
    }

    @Test
    void rejectsWhenQuantityExceedsStock() {
        when(itemRepo.findById(10L)).thenReturn(Optional.of(paper));
        eligibility("5000");

        assertThatThrownBy(() -> service.create(alice, dto(200)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("exceeds available stock");
        verify(emailService, never()).notify(any(StationeryRequest.class), any(), any(), any(), any());
    }

    @Test
    void rejectsWhenCostExceedsRemainingEligibility() {
        when(itemRepo.findById(10L)).thenReturn(Optional.of(paper));
        eligibility("500"); // only 500 left, request is 1000

        assertThatThrownBy(() -> service.create(alice, dto(4)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("eligibility");
    }

    @Test
    void approveDecrementsStockAndSetsApproved() {
        StationeryRequest req = submitted(4);
        when(requestRepo.findById(5L)).thenReturn(Optional.of(req));

        var result = service.approve(boss, 5L, "ok");

        assertThat(result.status()).isEqualTo("APPROVED");
        assertThat(paper.getAvailableQuantity()).isEqualTo(96); // 100 - 4
        verify(itemRepo).save(paper);
    }

    @Test
    void withdrawOnlyAllowedWhileSubmitted() {
        StationeryRequest req = submitted(4);
        req.setStatus(RequestStatus.APPROVED);
        when(requestRepo.findById(5L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.withdraw(alice, 5L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("awaiting approval");
    }

    @Test
    void confirmCancellationRestoresStock() {
        StationeryRequest req = submitted(4);
        req.setStatus(RequestStatus.CANCEL_REQUESTED);
        paper.setAvailableQuantity(96); // as if previously approved
        when(requestRepo.findById(5L)).thenReturn(Optional.of(req));

        var result = service.confirmCancellation(boss, 5L, null);

        assertThat(result.status()).isEqualTo("CANCELLED");
        assertThat(paper.getAvailableQuantity()).isEqualTo(100); // restored
    }

    private StationeryRequest submitted(int qty) {
        StationeryRequest r = new StationeryRequest();
        r.setId(5L);
        r.setRequestor(alice);
        r.addItem(new RequestItem(paper, qty));
        r.setTotalCost(paper.getUnitCost().multiply(BigDecimal.valueOf(qty)));
        r.setStatus(RequestStatus.SUBMITTED);
        return r;
    }
}
