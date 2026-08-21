package com.company.attendance.controller;

import com.company.attendance.dto.PermissionCreateRequest;
import com.company.attendance.dto.RequestStatusUpdateRequest;
import com.company.attendance.entity.PermissionRequest;
import com.company.attendance.enums.RequestStatus;
import com.company.attendance.service.PermissionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @PostMapping("/permissions")
    public ResponseEntity<PermissionRequest> applyPermission(@Valid @RequestBody PermissionCreateRequest request) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(permissionService.applyPermission(email, request));
    }

    @GetMapping("/permissions/my")
    public ResponseEntity<List<PermissionRequest>> getMyPermissions() {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(permissionService.getMyPermissions(email));
    }

    @GetMapping("/admin/permissions")
    public ResponseEntity<List<PermissionRequest>> getAllPermissions(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(permissionService.getAllPermissions(employeeId, status, startDate, endDate));
    }

    @PatchMapping("/admin/permissions/{id}/status")
    public ResponseEntity<PermissionRequest> updatePermissionStatus(
            @PathVariable Long id,
            @Valid @RequestBody RequestStatusUpdateRequest request) {
        return ResponseEntity.ok(permissionService.updatePermissionStatus(id, request));
    }

    private String getCurrentUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }
}
