package com.wsms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ChangeRoleDto {

    @NotBlank
    @Pattern(regexp = "USER|MANAGER", message = "Role must be USER or MANAGER")
    private String role;

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
