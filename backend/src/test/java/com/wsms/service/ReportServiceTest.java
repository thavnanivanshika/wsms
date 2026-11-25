package com.wsms.service;

import com.wsms.model.Category;
import com.wsms.model.Department;
import com.wsms.model.Designation;
import com.wsms.model.RequestItem;
import com.wsms.model.RequestStatus;
import com.wsms.model.Role;
import com.wsms.model.StationeryItem;
import com.wsms.model.StationeryRequest;
import com.wsms.model.User;
import com.wsms.repository.StationeryRequestRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReportServiceTest {

    private final StationeryRequestRepository repo = mock(StationeryRequestRepository.class);
    private final ReportService service = new ReportService(repo);

    private final Role roleUser = new Role(Role.USER, "user");
    private final Designation desig = new Designation("Lecturer", 1, new BigDecimal("5000"));
    private final Department dept = new Department("CSE", "CSE");

    @Test
    void aggregatesCostHeadCountAndPercentagesOverApprovedLineItems() {
        User alice = user(1L, "alice");
        User bob = user(2L, "bob");
        StationeryItem paper = item(10L, "Paper", "250.00");
        StationeryItem pen = item(20L, "Pen", "50.00");

        // Paper: alice 2 (500) + bob 2 (500) = 1000, 2 requestors.
        // Pen: alice 10 (500) = 500.  Cumulative = 1500.
        when(repo.findByStatusOrderByCreatedAtDesc(RequestStatus.APPROVED)).thenReturn(List.of(
                approved(alice, new int[][]{{0, 2}}, paper),
                approved(bob, new int[][]{{0, 2}}, paper),
                approved(alice, new int[][]{{0, 10}}, pen)));

        var report = service.build();

        assertThat(report.cumulativeCost()).isEqualByComparingTo("1500.00");
        assertThat(report.totalHeadCount()).isEqualTo(2);

        var paperLine = report.lines().stream().filter(l -> l.itemId().equals(10L)).findFirst().orElseThrow();
        assertThat(paperLine.totalQuantity()).isEqualTo(4);
        assertThat(paperLine.headCount()).isEqualTo(2);
        assertThat(paperLine.costIncurred()).isEqualByComparingTo("1000.00");
        assertThat(paperLine.percentOfTotal()).isEqualByComparingTo("66.67");

        var penLine = report.lines().stream().filter(l -> l.itemId().equals(20L)).findFirst().orElseThrow();
        assertThat(penLine.headCount()).isEqualTo(1);
        assertThat(penLine.percentOfTotal()).isEqualByComparingTo("33.33");
    }

    @Test
    void multipleLineItemsInOneRequestAreAggregated() {
        User alice = user(1L, "alice");
        StationeryItem paper = item(10L, "Paper", "250.00");
        StationeryItem pen = item(20L, "Pen", "50.00");
        // One request with two lines: paper x2 (500) + pen x4 (200) = 700.
        StationeryRequest r = new StationeryRequest();
        r.setRequestor(alice);
        r.setStatus(RequestStatus.APPROVED);
        r.addItem(new RequestItem(paper, 2));
        r.addItem(new RequestItem(pen, 4));
        when(repo.findByStatusOrderByCreatedAtDesc(RequestStatus.APPROVED)).thenReturn(List.of(r));

        var report = service.build();

        assertThat(report.lines()).hasSize(2);
        assertThat(report.cumulativeCost()).isEqualByComparingTo("700.00");
        assertThat(report.totalHeadCount()).isEqualTo(1);
    }

    @Test
    void emptyWhenNoApprovedRequests() {
        when(repo.findByStatusOrderByCreatedAtDesc(RequestStatus.APPROVED)).thenReturn(List.of());
        var report = service.build();
        assertThat(report.lines()).isEmpty();
        assertThat(report.cumulativeCost()).isEqualByComparingTo("0");
        assertThat(report.totalHeadCount()).isZero();
    }

    private User user(Long id, String name) {
        User u = new User(name, name + "@wsms.local", "x", roleUser, desig, dept, null);
        u.setId(id);
        return u;
    }

    private StationeryItem item(Long id, String name, String unitCost) {
        StationeryItem i = new StationeryItem(name, name, 100, new BigDecimal(unitCost),
                new Category("Cat", ""), roleUser);
        i.setId(id);
        return i;
    }

    /** Build an APPROVED request with the given (itemIndex, qty) lines for one item. */
    private StationeryRequest approved(User u, int[][] lines, StationeryItem item) {
        StationeryRequest r = new StationeryRequest();
        r.setRequestor(u);
        r.setStatus(RequestStatus.APPROVED);
        for (int[] l : lines) {
            r.addItem(new RequestItem(item, l[1]));
        }
        return r;
    }
}
