package com.wsms.config;

import com.wsms.model.Category;
import com.wsms.model.Department;
import com.wsms.model.Designation;
import com.wsms.model.RequestItem;
import com.wsms.model.RequestStatus;
import com.wsms.model.RequestStatusHistory;
import com.wsms.model.Role;
import com.wsms.model.StationeryItem;
import com.wsms.model.StationeryRequest;
import com.wsms.model.User;
import com.wsms.repository.CategoryRepository;
import com.wsms.repository.DepartmentRepository;
import com.wsms.repository.DesignationRepository;
import com.wsms.repository.RequestStatusHistoryRepository;
import com.wsms.repository.RoleRepository;
import com.wsms.repository.StationeryItemRepository;
import com.wsms.repository.StationeryRequestRepository;
import com.wsms.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Seeds the normalized demo dataset on startup. */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final CategoryRepository categoryRepository;
    private final StationeryItemRepository itemRepository;
    private final UserRepository userRepository;
    private final StationeryRequestRepository requestRepository;
    private final RequestStatusHistoryRepository historyRepository;
    private final PasswordEncoder passwordEncoder;

    private final String managerUsername;
    private final String managerEmail;
    private final String managerPassword;
    private final String userUsername;
    private final String userEmail;
    private final String userPassword;

    public DataInitializer(RoleRepository roleRepository,
                           DepartmentRepository departmentRepository,
                           DesignationRepository designationRepository,
                           CategoryRepository categoryRepository,
                           StationeryItemRepository itemRepository,
                           UserRepository userRepository,
                           StationeryRequestRepository requestRepository,
                           RequestStatusHistoryRepository historyRepository,
                           PasswordEncoder passwordEncoder,
                           @Value("${wsms.seed.manager.username}") String managerUsername,
                           @Value("${wsms.seed.manager.email}") String managerEmail,
                           @Value("${wsms.seed.manager.password}") String managerPassword,
                           @Value("${wsms.seed.user.username}") String userUsername,
                           @Value("${wsms.seed.user.email}") String userEmail,
                           @Value("${wsms.seed.user.password}") String userPassword) {
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.designationRepository = designationRepository;
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.requestRepository = requestRepository;
        this.historyRepository = historyRepository;
        this.passwordEncoder = passwordEncoder;
        this.managerUsername = managerUsername;
        this.managerEmail = managerEmail;
        this.managerPassword = managerPassword;
        this.userUsername = userUsername;
        this.userEmail = userEmail;
        this.userPassword = userPassword;
    }

    @Override
    public void run(String... args) {
        if (roleRepository.count() > 0) {
            return;
        }
        Role roleUser = roleRepository.save(new Role(Role.USER, "Regular user / requestor"));
        Role roleManager = roleRepository.save(new Role(Role.MANAGER, "Approver; can also request"));

        Department cse = departmentRepository.save(new Department("Computer Science", "CSE"));
        departmentRepository.save(new Department("Electronics", "ECE"));
        departmentRepository.save(new Department("Administration", "ADM"));

        Designation lecturer = designationRepository.save(new Designation("Lecturer", 1, new BigDecimal("5000")));

        Category paper = categoryRepository.save(new Category("Paper", "Paper and notebooks"));
        Category writing = categoryRepository.save(new Category("Writing", "Pens, markers, pencils"));
        Category office = categoryRepository.save(new Category("Office Equipment", "Staplers, machines"));

        itemRepository.save(new StationeryItem("A4 Paper Ream", "500 sheets, 75 GSM", 200, new BigDecimal("250.00"), paper, roleUser));
        itemRepository.save(new StationeryItem("Spiral Notebook", "200 pages, ruled", 300, new BigDecimal("90.00"), paper, roleUser));
        itemRepository.save(new StationeryItem("Blue Ballpoint Pen", "Box of 10", 500, new BigDecimal("50.00"), writing, roleUser));
        itemRepository.save(new StationeryItem("Whiteboard Marker", "Pack of 4, assorted", 150, new BigDecimal("120.00"), writing, roleUser));
        itemRepository.save(new StationeryItem("Stapler", "Heavy-duty, up to 25 sheets", 80, new BigDecimal("180.00"), office, roleUser));
        itemRepository.save(new StationeryItem("Laser Printer Toner", "Restricted to managers", 25, new BigDecimal("4500.00"), office, roleManager));
        itemRepository.save(new StationeryItem("Document Shredder", "Restricted to managers", 10, new BigDecimal("8000.00"), office, roleManager));

        User manager = userRepository.save(new User(managerUsername, managerEmail,
                passwordEncoder.encode(managerPassword), roleManager, lecturer, cse, null));
        User user = userRepository.save(new User(userUsername, userEmail,
                passwordEncoder.encode(userPassword), roleUser, lecturer, cse, manager));

        seedSampleRequest(user);

        log.info("Seeded {} roles, {} departments, {} designations, {} items, {} users",
                roleRepository.count(), departmentRepository.count(), designationRepository.count(),
                itemRepository.count(), userRepository.count());
    }

    /** One pending multi-line request so the manager queue has something to act on. */
    private void seedSampleRequest(User user) {
        List<StationeryItem> items = itemRepository.findByMinRole_Name(Role.USER);
        StationeryItem paper = items.get(0);
        StationeryItem pen = items.stream().filter(i -> i.getName().contains("Pen")).findFirst().orElse(items.get(1));

        StationeryRequest req = new StationeryRequest();
        req.setRequestor(user);
        req.setStatus(RequestStatus.SUBMITTED);
        req.setCreatedAt(Instant.now());
        req.addItem(new RequestItem(paper, 4));
        req.addItem(new RequestItem(pen, 5));
        req.setTotalCost(req.getItems().stream()
                .map(RequestItem::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
        requestRepository.save(req);
        historyRepository.save(new RequestStatusHistory(req, null, RequestStatus.SUBMITTED, user, "Seeded sample request"));
    }
}
