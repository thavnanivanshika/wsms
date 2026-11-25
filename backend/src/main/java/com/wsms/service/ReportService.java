package com.wsms.service;

import com.wsms.dto.ReportDto;
import com.wsms.model.RequestItem;
import com.wsms.model.RequestStatus;
import com.wsms.model.StationeryRequest;
import com.wsms.repository.StationeryRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Builds the management report over the line items of APPROVED requests: per-item quantity,
 * head count (distinct requestors), cost incurred and its percentage of the cumulative total.
 */
@Service
public class ReportService {

    private final StationeryRequestRepository requestRepository;

    public ReportService(StationeryRequestRepository requestRepository) {
        this.requestRepository = requestRepository;
    }

    @Transactional(readOnly = true)
    public ReportDto build() {
        List<StationeryRequest> approved =
                requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.APPROVED);

        Map<Long, Agg> byItem = new LinkedHashMap<>();
        Set<Long> allRequestors = new HashSet<>();

        for (StationeryRequest r : approved) {
            Long requestorId = r.getRequestor().getId();
            allRequestors.add(requestorId);
            for (RequestItem ri : r.getItems()) {
                Agg agg = byItem.computeIfAbsent(ri.getItem().getId(),
                        k -> new Agg(ri.getItem().getName()));
                agg.quantity += ri.getQuantity();
                agg.cost = agg.cost.add(ri.getLineTotal());
                agg.requestorIds.add(requestorId);
            }
        }

        BigDecimal cumulative = byItem.values().stream()
                .map(a -> a.cost).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ReportDto.Line> lines = new ArrayList<>();
        for (Map.Entry<Long, Agg> e : byItem.entrySet()) {
            Agg a = e.getValue();
            BigDecimal pct = cumulative.signum() == 0
                    ? BigDecimal.ZERO
                    : a.cost.multiply(BigDecimal.valueOf(100)).divide(cumulative, 2, RoundingMode.HALF_UP);
            lines.add(new ReportDto.Line(e.getKey(), a.name, a.quantity, a.requestorIds.size(),
                    a.cost, pct));
        }
        return new ReportDto(lines, cumulative, allRequestors.size());
    }

    private static final class Agg {
        final String name;
        int quantity;
        BigDecimal cost = BigDecimal.ZERO;
        final Set<Long> requestorIds = new HashSet<>();

        Agg(String name) {
            this.name = name;
        }
    }
}
