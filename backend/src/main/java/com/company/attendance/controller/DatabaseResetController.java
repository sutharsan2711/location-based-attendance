package com.company.attendance.controller;

import com.company.attendance.dto.DatabaseResetRequest;
import com.company.attendance.enums.Role;
import com.company.attendance.repository.*;
import com.company.attendance.service.DatabaseResetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/database")
@PreAuthorize("hasRole('ADMIN')")
public class DatabaseResetController {

    private final DatabaseResetService databaseResetService;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PermissionRequestRepository permissionRequestRepository;
    private final UserRepository userRepository;
    private final CompanyLocationRepository companyLocationRepository;

    public DatabaseResetController(
            DatabaseResetService databaseResetService,
            AttendanceRepository attendanceRepository,
            LeaveRequestRepository leaveRequestRepository,
            PermissionRequestRepository permissionRequestRepository,
            UserRepository userRepository,
            CompanyLocationRepository companyLocationRepository
    ) {
        this.databaseResetService = databaseResetService;
        this.attendanceRepository = attendanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.permissionRequestRepository = permissionRequestRepository;
        this.userRepository = userRepository;
        this.companyLocationRepository = companyLocationRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDatabaseStats() {
        long totalEmployees = userRepository.findByRoleNot(Role.ADMIN).size();
        long totalAttendances = attendanceRepository.count();
        long totalLeaves = leaveRequestRepository.count();
        long totalPermissions = permissionRequestRepository.count();
        long totalLocations = companyLocationRepository.count();

        return ResponseEntity.ok(Map.of(
                "totalEmployees", totalEmployees,
                "totalAttendances", totalAttendances,
                "totalLeaves", totalLeaves,
                "totalPermissions", totalPermissions,
                "totalLocations", totalLocations
        ));
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> executeReset(@Valid @RequestBody DatabaseResetRequest request) {
        Map<String, Object> result = databaseResetService.executeReset(request);
        return ResponseEntity.ok(result);
    }
}
