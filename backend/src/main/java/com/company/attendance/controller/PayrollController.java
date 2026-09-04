package com.company.attendance.controller;

import com.company.attendance.dto.PayrollDashboardStats;
import com.company.attendance.dto.PayrollGenerationRequest;
import com.company.attendance.dto.PayrollResponse;
import com.company.attendance.dto.PayslipResponse;
import com.company.attendance.enums.PayrollStatus;
import com.company.attendance.service.PayrollService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PayrollResponse>> getPayrollList(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) PayrollStatus status
    ) {
        List<PayrollResponse> list = payrollService.getPayrollList(month, year, employeeId, status);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PayrollDashboardStats> getStats(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();
        int targetYear = year != null ? year : LocalDate.now().getYear();
        PayrollDashboardStats stats = payrollService.getDashboardStats(targetMonth, targetYear);
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PayrollResponse>> generatePayroll(
            @Valid @RequestBody PayrollGenerationRequest request
    ) {
        List<PayrollResponse> generated = payrollService.generatePayroll(request);
        return ResponseEntity.ok(generated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PayrollResponse> getPayrollById(
            @PathVariable Long id,
            Authentication auth
    ) {
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        PayrollResponse response = payrollService.getPayrollById(id, auth.getName(), isAdmin);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PayrollResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String statusStr = body.get("status");
        PayrollStatus status = PayrollStatus.valueOf(statusStr.toUpperCase());
        PayrollResponse response = payrollService.updatePayrollStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<PayrollResponse>> getMyPayroll(
            @RequestParam(required = false) Integer year,
            Authentication auth
    ) {
        List<PayrollResponse> list = payrollService.getMyPayrollList(auth.getName(), year);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/my/{id}")
    public ResponseEntity<PayrollResponse> getMyPayrollById(
            @PathVariable Long id,
            Authentication auth
    ) {
        PayrollResponse response = payrollService.getPayrollById(id, auth.getName(), false);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/payslip")
    public ResponseEntity<PayslipResponse> getPayslip(
            @PathVariable Long id,
            Authentication auth
    ) {
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        PayslipResponse response = payrollService.getPayslip(id, auth.getName(), isAdmin);
        return ResponseEntity.ok(response);
    }
}
