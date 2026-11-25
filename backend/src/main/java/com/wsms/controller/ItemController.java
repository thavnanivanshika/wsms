package com.wsms.controller;

import com.wsms.dto.EligibilityDto;
import com.wsms.dto.ItemDto;
import com.wsms.service.CurrentUserProvider;
import com.wsms.service.ItemService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ItemController {

    private final ItemService itemService;
    private final CurrentUserProvider currentUser;

    public ItemController(ItemService itemService, CurrentUserProvider currentUser) {
        this.itemService = itemService;
        this.currentUser = currentUser;
    }

    /** Stationery availability, filtered by the caller's role. */
    @GetMapping("/items")
    public List<ItemDto> items() {
        return itemService.availableItemsFor(currentUser.require());
    }

    /** The caller's eligibility details (role cap, committed, remaining). */
    @GetMapping("/eligibility")
    public EligibilityDto eligibility() {
        return itemService.eligibilityFor(currentUser.require());
    }
}
