package com.company.attendance.dto;

import com.company.attendance.enums.Role;
import com.company.attendance.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class EmployeeRequest {

    @NotBlank(message = "Employee code is required")
    private String employeeCode;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String phone;
    
    // Optional during update, mandatory during creation (handled in service)
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    @NotNull(message = "Status is required")
    private UserStatus status;

    private String department;

    private String profileData;

    // Getters and Setters
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getProfileData() { return profileData; }
    public void setProfileData(String profileData) { this.profileData = profileData; }
}
