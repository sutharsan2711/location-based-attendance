package com.company.attendance.controller;

import com.company.attendance.dto.AttendanceRequest;
import com.company.attendance.dto.AttendanceResponse;
import com.company.attendance.entity.Attendance;
import com.company.attendance.enums.AttendanceStatus;
import com.company.attendance.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/login")
    public ResponseEntity<AttendanceResponse> login(@Valid @RequestBody AttendanceRequest request) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(attendanceService.loginAttendance(email, request));
    }

    @PostMapping("/logout")
    public ResponseEntity<AttendanceResponse> logout(@Valid @RequestBody AttendanceRequest request) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(attendanceService.logoutAttendance(email, request));
    }

    @GetMapping("/today")
    public ResponseEntity<Attendance> getTodayAttendance() {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(attendanceService.getTodayAttendance(email));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Attendance>> getHistory() {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(attendanceService.getEmployeeAttendanceHistory(email));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Attendance>> getEmployeeHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getEmployeeAttendanceHistoryById(employeeId));
    }

    @GetMapping
    public ResponseEntity<List<Attendance>> getAllAttendance(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(attendanceService.getAllAttendanceFiltered(employeeId, status, startDate, endDate));
    }

    private String getCurrentUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }
}
