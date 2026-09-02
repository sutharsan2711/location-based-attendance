package com.company.attendance.dto;

import com.company.attendance.enums.Role;

public class LoginResponse {

    private String token;
    private UserDto user;

    public LoginResponse() {}

    public LoginResponse(String token, UserDto user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public static class UserDto {
        private Long id;
        private String name;
        private String email;
        private String employeeCode;
        private String department;
        private Role role;

        public UserDto() {}

        public UserDto(Long id, String name, String email, String employeeCode, String department, Role role) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.employeeCode = employeeCode;
            this.department = department;
            this.role = role;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getEmployeeCode() { return employeeCode; }
        public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }

        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }
    }
}
