package com.company.attendance.controller;

import com.company.attendance.enums.AttendanceStatus;
import com.company.attendance.service.DashboardService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final DashboardService dashboardService;

    public AdminController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    @GetMapping("/attendance-summary")
    public ResponseEntity<List<Map<String, Object>>> getAttendanceSummaryCharts() {
        return ResponseEntity.ok(dashboardService.getAttendanceSummaryCharts());
    }

    @GetMapping("/attendance-report")
    public ResponseEntity<List<Map<String, Object>>> getAttendanceReport(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getAttendanceReport(employeeId, status, startDate, endDate));
    }

    @GetMapping("/attendance-report/csv")
    public void exportAttendanceReportCsv(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletResponse response) throws IOException {

        response.setContentType("text/csv");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"attendance_report.csv\"");

        List<Map<String, Object>> data = dashboardService.getAttendanceReport(employeeId, status, startDate, endDate);

        PrintWriter writer = response.getWriter();
        // BOM for Excel UTF-8 compliance
        writer.write('\ufeff');
        // Write CSV Header
        writer.println("Employee Code,Employee Name,Date,Login Time,Login Distance,Logout Time,Logout Distance,Working Hours,Status");

        for (Map<String, Object> row : data) {
            writer.println(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"",
                    row.getOrDefault("employeeCode", ""),
                    row.getOrDefault("employeeName", ""),
                    row.getOrDefault("date", ""),
                    row.getOrDefault("loginTime", ""),
                    row.getOrDefault("loginDistance", ""),
                    row.getOrDefault("logoutTime", ""),
                    row.getOrDefault("logoutDistance", ""),
                    row.getOrDefault("workingHours", ""),
                    row.getOrDefault("status", "")
            ));
        }
        writer.flush();
        writer.close();
    }
}
