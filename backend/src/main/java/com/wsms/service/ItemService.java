package com.wsms.service;

import com.wsms.dto.EligibilityDto;
import com.wsms.dto.ItemDto;
import com.wsms.dto.SaveItemDto;
import com.wsms.exception.ApiException;
import com.wsms.model.Category;
import com.wsms.model.RequestStatus;
import com.wsms.model.Role;
import com.wsms.model.StationeryItem;
import com.wsms.model.StationeryRequest;
import com.wsms.model.User;
import com.wsms.repository.CategoryRepository;
import com.wsms.repository.RoleRepository;
import com.wsms.repository.StationeryItemRepository;
import com.wsms.repository.StationeryRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ItemService {

    private final StationeryItemRepository itemRepository;
    private final StationeryRequestRepository requestRepository;
    private final CategoryRepository categoryRepository;
    private final RoleRepository roleRepository;

    public ItemService(StationeryItemRepository itemRepository,
                       StationeryRequestRepository requestRepository,
                       CategoryRepository categoryRepository,
                       RoleRepository roleRepository) {
        this.itemRepository = itemRepository;
        this.requestRepository = requestRepository;
        this.categoryRepository = categoryRepository;
        this.roleRepository = roleRepository;
    }

    /** Availability filtered by role: USERs see USER items; ADMINs see all. */
    public List<ItemDto> availableItemsFor(User user) {
        List<StationeryItem> items = user.getRole().isManager()
                ? itemRepository.findAll()
                : itemRepository.findByMinRole_Name(Role.USER);
        return items.stream().map(ItemDto::from).toList();
    }

    /** All items — for the admin portal. */
    public List<ItemDto> allItems() {
        return itemRepository.findAll().stream().map(ItemDto::from).toList();
    }

    @Transactional
    public ItemDto createItem(SaveItemDto dto) {
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> ApiException.notFound("Category not found"));
        Role minRole = roleRepository.findByName(dto.isAdminOnly() ? Role.MANAGER : Role.USER)
                .orElseThrow(() -> ApiException.notFound("Role not found"));
        StationeryItem item = new StationeryItem(
                dto.getName().trim(),
                dto.getDescription(),
                dto.getQuantity(),
                dto.getUnitCost(),
                category,
                minRole
        );
        return ItemDto.from(itemRepository.save(item));
    }

    @Transactional
    public ItemDto updateItem(Long id, SaveItemDto dto) {
        StationeryItem item = itemRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Item not found"));
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> ApiException.notFound("Category not found"));
        Role minRole = roleRepository.findByName(dto.isAdminOnly() ? Role.MANAGER : Role.USER)
                .orElseThrow(() -> ApiException.notFound("Role not found"));
        item.setName(dto.getName().trim());
        item.setDescription(dto.getDescription());
        item.setAvailableQuantity(dto.getQuantity());
        item.setUnitCost(dto.getUnitCost());
        item.setCategory(category);
        item.setMinRole(minRole);
        return ItemDto.from(itemRepository.save(item));
    }

    @Transactional
    public void deleteItem(Long id) {
        if (!itemRepository.existsById(id)) {
            throw ApiException.notFound("Item not found");
        }
        itemRepository.deleteById(id);
    }

    /**
     * Eligibility: the user's designation cap minus the value already committed in active
     * requests (SUBMITTED / APPROVED / CANCEL_REQUESTED).
     */
    public EligibilityDto eligibilityFor(User user) {
        BigDecimal committed = committedValue(user);
        BigDecimal remaining = user.getMaxPurchaseValue().subtract(committed);
        if (remaining.signum() < 0) {
            remaining = BigDecimal.ZERO;
        }
        return EligibilityDto.of(user, committed, remaining);
    }

    public BigDecimal committedValue(User user) {
        return requestRepository.findByRequestorOrderByCreatedAtDesc(user).stream()
                .filter(r -> isCommitted(r.getStatus()))
                .filter(r -> user.getEligibilityResetAt() == null
                        || r.getCreatedAt().isAfter(user.getEligibilityResetAt()))
                .map(StationeryRequest::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean isCommitted(RequestStatus status) {
        return status == RequestStatus.SUBMITTED
                || status == RequestStatus.APPROVED
                || status == RequestStatus.CANCEL_REQUESTED;
    }
}
