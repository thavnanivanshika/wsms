package com.wsms.repository;

import com.wsms.model.StationeryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StationeryItemRepository extends JpaRepository<StationeryItem, Long> {

    /** Items whose required role matches the given role name (e.g. "USER"). */
    List<StationeryItem> findByMinRole_Name(String roleName);
}
