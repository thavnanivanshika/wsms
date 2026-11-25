package com.wsms.repository;

import com.wsms.model.Designation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DesignationRepository extends JpaRepository<Designation, Long> {
    List<Designation> findAllByOrderByRankAsc();
}
