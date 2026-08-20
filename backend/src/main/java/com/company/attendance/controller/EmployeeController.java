package com.company.attendance.controller;

import com.company.attendance.dto.EmployeeRequest;
import com.company.attendance.entity.User;
import com.company.attendance.enums.UserStatus;
import com.company.attendance.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PostMapping
    public ResponseEntity<User> createEmployee(@Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(employeeService.createEmployee(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateEmployee(@PathVariable Long id, @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Employee deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<User> toggleEmployeeStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            throw new IllegalArgumentException("Status value is required");
        }
        UserStatus status = UserStatus.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(employeeService.toggleEmployeeStatus(id, status));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String newPassword = body.get("password");
        employeeService.resetPassword(id, newPassword);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Password reset successfully");
        return ResponseEntity.ok(response);
    }
}
