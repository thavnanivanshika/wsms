package com.wsms.service;

import com.wsms.dto.AuthResponse;
import com.wsms.dto.ChangePasswordRequest;
import com.wsms.dto.LoginRequest;
import com.wsms.dto.RegisterRequest;
import com.wsms.exception.ApiException;
import com.wsms.model.Department;
import com.wsms.model.Designation;
import com.wsms.model.Role;
import com.wsms.model.User;
import com.wsms.repository.DepartmentRepository;
import com.wsms.repository.DesignationRepository;
import com.wsms.repository.RoleRepository;
import com.wsms.repository.UserRepository;
import com.wsms.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       DepartmentRepository departmentRepository,
                       DesignationRepository designationRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtil jwtUtil,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.designationRepository = designationRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw ApiException.conflictField("username", "Username is already taken");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw ApiException.conflictField("email", "Email is already registered");
        }
        Department department = departmentRepository.findById(req.getDepartmentId())
                .orElseThrow(() -> ApiException.badRequest("Invalid department"));
        Designation designation = designationRepository.findAll().stream()
                .min(java.util.Comparator.comparingLong(Designation::getId))
                .orElseThrow(() -> ApiException.badRequest("No designation configured"));
        Role role = roleRepository.findByName(req.isManager() ? Role.MANAGER : Role.USER)
                .orElseThrow(() -> ApiException.badRequest("Role not configured"));
        User superior = null;
        if (req.getSuperiorId() != null) {
            superior = userRepository.findById(req.getSuperiorId())
                    .orElseThrow(() -> ApiException.badRequest("Invalid superior"));
        }

        User user = new User(req.getUsername(), req.getEmail(),
                passwordEncoder.encode(req.getPassword()), role, designation, department, superior);
        userRepository.save(user);
        return AuthResponse.of(jwtUtil.generateToken(user.getUsername(), role.getName()), user);
    }

    public AuthResponse login(LoginRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
        } catch (BadCredentialsException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> ApiException.notFound("User not found"));
        return AuthResponse.of(jwtUtil.generateToken(user.getUsername(), user.getRole().getName()), user);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest req) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        emailService.notify(user.getEmail(), user.getSuperiorEmail(),
                "WSMS: Your password was changed",
                "Hello " + user.getUsername() + ",\n\n"
                        + "This is a confirmation that your WSMS account password was changed.\n"
                        + "If you did not perform this change, contact your administrator immediately.");
    }
}
