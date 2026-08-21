package com.company.attendance.controller;

import com.company.attendance.dto.LeaveCreateRequest;
import com.company.attendance.dto.RequestStatusUpdateRequest;
import com.company.attendance.entity.LeaveRequest;
import com.company.attendance.enums.RequestStatus;
import com.company.attendance.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @PostMapping("/leaves")
    public ResponseEntity<LeaveRequest> applyLeave(@Valid @RequestBody LeaveCreateRequest request) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(leaveService.applyLeave(email, request));
    }

    @GetMapping("/leaves/my")
    public ResponseEntity<List<LeaveRequest>> getMyLeaves() {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(leaveService.getMyLeaves(email));
    }

    @GetMapping("/admin/leaves")
    public ResponseEntity<List<LeaveRequest>> getAllLeaves(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(leaveService.getAllLeaves(employeeId, status, startDate, endDate));
    }

    @PatchMapping("/admin/leaves/{id}/status")
    public ResponseEntity<LeaveRequest> updateLeaveStatus(
            @PathVariable Long id,
            @Valid @RequestBody RequestStatusUpdateRequest request) {
        return ResponseEntity.ok(leaveService.updateLeaveStatus(id, request));
    }

    @GetMapping("/leaves/balances/my")
    public ResponseEntity<com.company.attendance.dto.LeaveBalanceSummaryResponse> getMyLeaveBalances(
            @RequestParam(required = false, defaultValue = "0") int year) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(leaveService.getMyLeaveBalances(email, year));
    }

    @GetMapping("/admin/leaves/balances")
    public ResponseEntity<List<com.company.attendance.dto.LeaveBalanceSummaryResponse>> getAllLeaveBalances(
            @RequestParam(required = false, defaultValue = "0") int year) {
        return ResponseEntity.ok(leaveService.getAllLeaveBalances(year));
    }

    @PutMapping("/admin/leaves/balances")
    public ResponseEntity<com.company.attendance.dto.LeaveBalanceSummaryResponse> updateLeaveGrants(
            @Valid @RequestBody com.company.attendance.dto.LeaveGrantUpdateRequest request) {
        return ResponseEntity.ok(leaveService.updateLeaveGrants(request));
    }

    private String getCurrentUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }
}

