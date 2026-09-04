package com.company.attendance.service;

import com.company.attendance.dto.DatabaseResetRequest;
import com.company.attendance.entity.CompanyLocation;
import com.company.attendance.entity.User;
import com.company.attendance.enums.Role;
import com.company.attendance.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
public class DatabaseResetService {

    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PermissionRequestRepository permissionRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final PayrollRepository payrollRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final SalaryHistoryRepository salaryHistoryRepository;
    private final UserRepository userRepository;
    private final CompanyLocationRepository companyLocationRepository;

    public DatabaseResetService(
            AttendanceRepository attendanceRepository,
            LeaveRequestRepository leaveRequestRepository,
            PermissionRequestRepository permissionRequestRepository,
            LeaveBalanceRepository leaveBalanceRepository,
            PayrollRepository payrollRepository,
            SalaryStructureRepository salaryStructureRepository,
            SalaryHistoryRepository salaryHistoryRepository,
            UserRepository userRepository,
            CompanyLocationRepository companyLocationRepository
    ) {
        this.attendanceRepository = attendanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.permissionRequestRepository = permissionRequestRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.payrollRepository = payrollRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.salaryHistoryRepository = salaryHistoryRepository;
        this.userRepository = userRepository;
        this.companyLocationRepository = companyLocationRepository;
    }

    @Transactional
    public Map<String, Object> executeReset(DatabaseResetRequest request) {
        String code = request.getConfirmationCode() != null ? request.getConfirmationCode().trim().toUpperCase() : "";
        if (!"CONFIRM_RESET".equals(code) && !"CONFIRM_DELETE".equals(code) && !"CONFIRM".equals(code)) {
            throw new IllegalArgumentException("Invalid confirmation code. Please type CONFIRM_RESET to proceed.");
        }

        String type = request.getResetType() != null ? request.getResetType().trim().toUpperCase() : "";

        switch (type) {
            case "ATTENDANCE":
                return clearAttendanceLogs();

            case "LEAVES":
                return clearLeavesAndPermissions();

            case "EMPLOYEES":
                return clearAllEmployees();

            case "FULL_SYSTEM_RESET":
            case "FULL_WIPE":
                return executeFullSystemReset();

            default:
                throw new IllegalArgumentException("Unsupported reset type: " + type);
        }
    }

    @Transactional
    public Map<String, Object> clearAttendanceLogs() {
        long count = attendanceRepository.count();
        attendanceRepository.deleteAllInBatch();
        return Map.of(
                "success", true,
                "message", "Successfully purged " + count + " attendance log record(s) from the database.",
                "deletedCount", count
        );
    }

    @Transactional
    public Map<String, Object> clearLeavesAndPermissions() {
        long permCount = permissionRequestRepository.count();
        long leaveCount = leaveRequestRepository.count();
        long balCount = leaveBalanceRepository.count();

        permissionRequestRepository.deleteAllInBatch();
        leaveRequestRepository.deleteAllInBatch();
        leaveBalanceRepository.deleteAllInBatch();

        long total = permCount + leaveCount + balCount;
        return Map.of(
                "success", true,
                "message", "Successfully cleared all leave requests (" + leaveCount + "), permissions (" + permCount + "), and balance records.",
                "deletedCount", total
        );
    }

    @Transactional
    public Map<String, Object> clearAllEmployees() {
        // Cascade delete child relations first to satisfy foreign key constraints
        attendanceRepository.deleteAllInBatch();
        permissionRequestRepository.deleteAllInBatch();
        leaveRequestRepository.deleteAllInBatch();
        leaveBalanceRepository.deleteAllInBatch();
        payrollRepository.deleteAllInBatch();
        salaryHistoryRepository.deleteAllInBatch();
        salaryStructureRepository.deleteAllInBatch();

        List<User> nonAdmins = userRepository.findByRoleNot(Role.ADMIN);
        long employeeCount = nonAdmins.size();
        if (!nonAdmins.isEmpty()) {
            userRepository.deleteAllInBatch(nonAdmins);
        }

        return Map.of(
                "success", true,
                "message", "Successfully removed " + employeeCount + " employee account(s) and all their associated records. Admin account is preserved.",
                "deletedCount", employeeCount
        );
    }

    @Transactional
    public Map<String, Object> executeFullSystemReset() {
        // 1. Delete all attendance, permissions, leaves, balances, payroll
        attendanceRepository.deleteAllInBatch();
        permissionRequestRepository.deleteAllInBatch();
        leaveRequestRepository.deleteAllInBatch();
        leaveBalanceRepository.deleteAllInBatch();
        payrollRepository.deleteAllInBatch();
        salaryHistoryRepository.deleteAllInBatch();
        salaryStructureRepository.deleteAllInBatch();

        // 2. Delete all non-admin employees
        List<User> nonAdmins = userRepository.findByRoleNot(Role.ADMIN);
        long employeeCount = nonAdmins.size();
        if (!nonAdmins.isEmpty()) {
            userRepository.deleteAllInBatch(nonAdmins);
        }

        // 3. Reset Company Locations to single clean default
        companyLocationRepository.deleteAllInBatch();
        CompanyLocation defaultLoc = new CompanyLocation("ABC Technologies - Main Office", 11.078319, 76.999745, 50.0, 100.0);
        defaultLoc.setItLoginTime(LocalTime.of(9, 0));
        defaultLoc.setItLogoutTime(LocalTime.of(18, 30));
        defaultLoc.setItGraceMinutes(15);
        defaultLoc.setEdtechLoginTime(LocalTime.of(8, 45));
        defaultLoc.setEdtechLogoutTime(LocalTime.of(17, 45));
        defaultLoc.setEdtechGraceMinutes(15);
        defaultLoc.setBusinessLoginTime(LocalTime.of(8, 45));
        defaultLoc.setBusinessLogoutTime(LocalTime.of(17, 45));
        defaultLoc.setBusinessGraceMinutes(15);
        companyLocationRepository.save(defaultLoc);

        return Map.of(
                "success", true,
                "message", "Full system reset completed. Clean production state restored. Admin account preserved.",
                "deletedCount", employeeCount
        );
    }
}
