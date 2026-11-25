package com.wsms.controller;

import com.wsms.dto.ChangeRoleDto;
import com.wsms.dto.DecisionDto;
import com.wsms.dto.ItemDto;
import com.wsms.dto.ReportDto;
import com.wsms.dto.RequestDto;
import com.wsms.dto.SaveCategoryDto;
import com.wsms.dto.SaveDepartmentDto;
import com.wsms.dto.SaveItemDto;
import com.wsms.dto.UserSummaryDto;
import com.wsms.exception.ApiException;
import com.wsms.model.Category;
import com.wsms.model.Department;
import com.wsms.model.Role;
import com.wsms.model.User;
import com.wsms.repository.CategoryRepository;
import com.wsms.repository.DepartmentRepository;
import com.wsms.repository.RoleRepository;
import com.wsms.repository.UserRepository;
import com.wsms.service.CurrentUserProvider;
import com.wsms.service.ItemService;
import com.wsms.service.ReportService;
import com.wsms.service.RequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Admin-only actions. Access restricted to ROLE_MANAGER in SecurityConfig. */
@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    private final RequestService requestService;
    private final ItemService itemService;
    private final ReportService reportService;
    private final CurrentUserProvider currentUser;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CategoryRepository categoryRepository;
    private final DepartmentRepository departmentRepository;

    public ManagerController(RequestService requestService,
                             ItemService itemService,
                             ReportService reportService,
                             CurrentUserProvider currentUser,
                             UserRepository userRepository,
                             RoleRepository roleRepository,
                             CategoryRepository categoryRepository,
                             DepartmentRepository departmentRepository) {
        this.requestService = requestService;
        this.itemService = itemService;
        this.reportService = reportService;
        this.currentUser = currentUser;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.categoryRepository = categoryRepository;
        this.departmentRepository = departmentRepository;
    }

    // ---- Request management ----

    /** All requests. Pass ?pending=true for only those awaiting action. */
    @GetMapping("/requests")
    public List<RequestDto> requests(@RequestParam(defaultValue = "false") boolean pending) {
        return pending ? requestService.pendingForManager() : requestService.allRequests();
    }

    @PostMapping("/requests/{id}/approve")
    public RequestDto approve(@PathVariable Long id, @RequestBody(required = false) DecisionDto body) {
        return requestService.approve(currentUser.require(), id, comments(body));
    }

    @PostMapping("/requests/{id}/reject")
    public RequestDto reject(@PathVariable Long id, @RequestBody(required = false) DecisionDto body) {
        return requestService.reject(currentUser.require(), id, comments(body));
    }

    @PostMapping("/requests/{id}/confirm-cancel")
    public RequestDto confirmCancel(@PathVariable Long id,
                                    @RequestBody(required = false) DecisionDto body) {
        return requestService.confirmCancellation(currentUser.require(), id, comments(body));
    }

    // ---- Stationery item management ----

    @GetMapping("/items")
    public List<ItemDto> allItems() {
        return itemService.allItems();
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public ItemDto createItem(@Valid @RequestBody SaveItemDto dto) {
        return itemService.createItem(dto);
    }

    @PutMapping("/items/{id}")
    public ItemDto updateItem(@PathVariable Long id, @Valid @RequestBody SaveItemDto dto) {
        return itemService.updateItem(id, dto);
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable Long id) {
        itemService.deleteItem(id);
    }

    // ---- User management ----

    @GetMapping("/users")
    public List<UserSummaryDto> allUsers() {
        return userRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(User::getUsername))
                .map(UserSummaryDto::from).toList();
    }

    @PutMapping("/users/{id}/role")
    public UserSummaryDto changeRole(@PathVariable Long id, @Valid @RequestBody ChangeRoleDto dto) {
        User me = currentUser.require();
        if (me.getId().equals(id)) throw ApiException.badRequest("You cannot change your own role");
        User target = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        Role role = roleRepository.findByName(dto.getRole())
                .orElseThrow(() -> ApiException.badRequest("Invalid role"));
        target.setRole(role);
        return UserSummaryDto.from(userRepository.save(target));
    }

    @PostMapping("/users/{id}/reset-spend")
    public UserSummaryDto resetSpend(@PathVariable Long id) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        target.setEligibilityResetAt(Instant.now());
        return UserSummaryDto.from(userRepository.save(target));
    }

    // ---- Report ----

    @GetMapping("/report")
    public ReportDto report() {
        return reportService.build();
    }

    // ---- Category management ----

    @GetMapping("/categories")
    public List<Map<String, Object>> allCategories() {
        return categoryRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(Category::getName))
                .map(c -> catMap(c))
                .toList();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createCategory(@Valid @RequestBody SaveCategoryDto dto) {
        if (categoryRepository.findAll().stream().anyMatch(c -> c.getName().equalsIgnoreCase(dto.getName()))) {
            throw ApiException.conflictField("name", "Category name already exists");
        }
        return catMap(categoryRepository.save(new Category(dto.getName().trim(), dto.getDescription())));
    }

    @PutMapping("/categories/{id}")
    public Map<String, Object> updateCategory(@PathVariable Long id, @Valid @RequestBody SaveCategoryDto dto) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Category not found"));
        c.setName(dto.getName().trim());
        c.setDescription(dto.getDescription());
        return catMap(categoryRepository.save(c));
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        categoryRepository.findById(id).orElseThrow(() -> ApiException.notFound("Category not found"));
        categoryRepository.deleteById(id);
    }

    private Map<String, Object> catMap(Category c) {
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("description", c.getDescription() != null ? c.getDescription() : "");
        return m;
    }

    // ---- Department management ----

    @GetMapping("/departments")
    public List<Map<String, Object>> allDepartments() {
        return departmentRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(Department::getName))
                .map(d -> deptMap(d))
                .toList();
    }

    @PostMapping("/departments")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createDepartment(@Valid @RequestBody SaveDepartmentDto dto) {
        return deptMap(departmentRepository.save(new Department(dto.getName().trim(), dto.getCode().trim().toUpperCase())));
    }

    @PutMapping("/departments/{id}")
    public Map<String, Object> updateDepartment(@PathVariable Long id, @Valid @RequestBody SaveDepartmentDto dto) {
        Department d = departmentRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Department not found"));
        d.setName(dto.getName().trim());
        d.setCode(dto.getCode().trim().toUpperCase());
        return deptMap(departmentRepository.save(d));
    }

    @DeleteMapping("/departments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDepartment(@PathVariable Long id) {
        departmentRepository.findById(id).orElseThrow(() -> ApiException.notFound("Department not found"));
        departmentRepository.deleteById(id);
    }

    private Map<String, Object> deptMap(Department d) {
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", d.getId());
        m.put("name", d.getName());
        m.put("code", d.getCode());
        return m;
    }

    private String comments(DecisionDto body) {
        return body != null ? body.getComments() : null;
    }
}
