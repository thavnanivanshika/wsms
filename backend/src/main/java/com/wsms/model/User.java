package com.wsms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @ManyToOne(optional = false)
    @JoinColumn(name = "role_id")
    private Role role;

    @ManyToOne(optional = false)
    @JoinColumn(name = "designation_id")
    private Designation designation;

    @ManyToOne(optional = false)
    @JoinColumn(name = "department_id")
    private Department department;

    /** This person's superior / approver (self-reference, optional). */
    @ManyToOne
    @JoinColumn(name = "superior_id")
    private User superior;

    @Column
    private Instant eligibilityResetAt;

    public User() {
    }

    public User(String username, String email, String passwordHash,
                Role role, Designation designation, Department department, User superior) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.designation = designation;
        this.department = department;
        this.superior = superior;
    }

    /** Eligibility cap is derived from the user's designation. */
    public BigDecimal getMaxPurchaseValue() {
        return designation != null ? designation.getMaxPurchaseValue() : BigDecimal.ZERO;
    }

    /** Convenience accessor for the superior's e-mail (used for notifications). */
    public String getSuperiorEmail() {
        return superior != null ? superior.getEmail() : null;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Designation getDesignation() {
        return designation;
    }

    public void setDesignation(Designation designation) {
        this.designation = designation;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public User getSuperior() {
        return superior;
    }

    public void setSuperior(User superior) {
        this.superior = superior;
    }

    public Instant getEligibilityResetAt() {
        return eligibilityResetAt;
    }

    public void setEligibilityResetAt(Instant eligibilityResetAt) {
        this.eligibilityResetAt = eligibilityResetAt;
    }
}
