package com.wsms.repository;

import com.wsms.model.RequestStatus;
import com.wsms.model.StationeryRequest;
import com.wsms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StationeryRequestRepository extends JpaRepository<StationeryRequest, Long> {

    List<StationeryRequest> findByRequestorOrderByCreatedAtDesc(User requestor);

    List<StationeryRequest> findByStatusInOrderByCreatedAtDesc(List<RequestStatus> statuses);

    List<StationeryRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);
}
