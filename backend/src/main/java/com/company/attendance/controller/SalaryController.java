package com.company.attendance.controller;

import com.company.attendance.dto.SalaryHistoryResponse;
import com.company.attendance.dto.SalaryStructureRequest;
import com.company.attendance.dto.SalaryStructureResponse;
import com.company.attendance.entity.User;
import com.company.attendance.exception.ResourceNotFoundException;
import com.company.attendance.repository.UserRepository;
import com.company.attendance.service.SalaryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/salary")
public class SalaryController {

    private final SalaryService salaryService;
    private final UserRepository userRepository;

    public SalaryController(SalaryService salaryService, UserRepository userRepository) {
        this.salaryService = salaryService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SalaryStructureResponse>> getAllSalaryStructures() {
        return ResponseEntity.ok(salaryService.getAllSalaryStructures());
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<SalaryStructureResponse> getSalaryStructure(
            @PathVariable Long employeeId,
            Authentication auth
    ) {
        validateAccess(auth, employeeId);
        return ResponseEntity.ok(salaryService.getSalaryStructureByEmployeeId(employeeId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SalaryStructureResponse> saveSalaryStructure(
            @Valid @RequestBody SalaryStructureRequest request
    ) {
        return ResponseEntity.ok(salaryService.saveOrUpdateSalaryStructure(request));
    }

    @PutMapping("/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SalaryStructureResponse> updateSalaryStructure(
            @PathVariable Long employeeId,
            @Valid @RequestBody SalaryStructureRequest request
    ) {
        request.setEmployeeId(employeeId);
        return ResponseEntity.ok(salaryService.saveOrUpdateSalaryStructure(request));
    }

    @GetMapping("/history/{employeeId}")
    public ResponseEntity<List<SalaryHistoryResponse>> getSalaryHistory(
            @PathVariable Long employeeId,
            Authentication auth
    ) {
        validateAccess(auth, employeeId);
        return ResponseEntity.ok(salaryService.getSalaryHistory(employeeId));
    }

    @GetMapping("/my")
    public ResponseEntity<SalaryStructureResponse> getMySalaryStructure(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(salaryService.getSalaryStructureByEmployeeId(user.getId()));
    }

    private void validateAccess(Authentication auth, Long targetEmployeeId) {
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            User current = userRepository.findByEmail(auth.getName()).orElse(null);
            if (current == null || !current.getId().equals(targetEmployeeId)) {
                throw new AccessDeniedException("Access denied: You cannot view another employee's salary.");
            }
        }
    }
}
