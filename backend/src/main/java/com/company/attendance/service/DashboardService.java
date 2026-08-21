package com.company.attendance.service;

import com.company.attendance.entity.Attendance;
import com.company.attendance.entity.LeaveRequest;
import com.company.attendance.entity.PermissionRequest;
import com.company.attendance.entity.User;
import com.company.attendance.enums.*;
import com.company.attendance.repository.AttendanceRepository;
import com.company.attendance.repository.LeaveRequestRepository;
import com.company.attendance.repository.PermissionRequestRepository;
import com.company.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;
    private final PermissionRequestRepository permissionRepository;
    private final LeaveRequestRepository leaveRepository;

    private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");

    public DashboardService(UserRepository userRepository,
                            AttendanceRepository attendanceRepository,
                            PermissionRequestRepository permissionRepository,
                            LeaveRequestRepository leaveRepository) {
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
        this.permissionRepository = permissionRepository;
        this.leaveRepository = leaveRepository;
    }

    public Map<String, Object> getDashboardStats() {
        LocalDate today = LocalDate.now(KOLKATA_ZONE);

        // Fetch all employees (excluding admin)
        List<User> employees = userRepository.findByRole(Role.EMPLOYEE);
        long totalEmployees = employees.size();
        long activeEmployees = employees.stream().filter(u -> u.getStatus() == UserStatus.ACTIVE).count();

        // Attendance stats for today
        long todayLogin = attendanceRepository.countByAttendanceDateAndStatusIn(
                today, Arrays.asList(AttendanceStatus.LOGGED_IN, AttendanceStatus.COMPLETED));
        
        long todayLogout = attendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.COMPLETED);
        
        long currentlyWorking = attendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.LOGGED_IN);
        
        // Late today count
        List<Attendance> todayAttendances = attendanceRepository.findByAttendanceDate(today);
        long lateToday = todayAttendances.stream()
                .filter(a -> a.getTimingStatus() == AttendanceTimingStatus.LATE)
                .count();

        // On leave today count
        List<LeaveRequest> approvedLeavesToday = leaveRepository.findApprovedLeavesForDate(today, RequestStatus.APPROVED);
        long onLeaveToday = approvedLeavesToday.size();

        // Pending requests counts
        long pendingPermissionRequests = permissionRepository.countByStatus(RequestStatus.PENDING);
        long pendingLeaveRequests = leaveRepository.countByStatus(RequestStatus.PENDING);

        long absent = Math.max(0, activeEmployees - todayLogin - onLeaveToday);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEmployees", totalEmployees);
        stats.put("activeEmployees", activeEmployees);
        stats.put("presentToday", todayLogin);
        stats.put("todayLogin", todayLogin);
        stats.put("todayLogout", todayLogout);
        stats.put("currentlyWorking", currentlyWorking);
        stats.put("lateToday", lateToday);
        stats.put("onLeaveToday", onLeaveToday);
        stats.put("pendingPermissionRequests", pendingPermissionRequests);
        stats.put("pendingLeaveRequests", pendingLeaveRequests);
        stats.put("absent", absent);

        return stats;
    }

    public List<Map<String, Object>> getAttendanceSummaryCharts() {
        List<Map<String, Object>> chartData = new ArrayList<>();
        LocalDate today = LocalDate.now(KOLKATA_ZONE);
        long activeEmployees = userRepository.findByRole(Role.EMPLOYEE).stream()
                .filter(u -> u.getStatus() == UserStatus.ACTIVE).count();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            long loginCount = attendanceRepository.countByAttendanceDateAndStatusIn(
                    date, Arrays.asList(AttendanceStatus.LOGGED_IN, AttendanceStatus.COMPLETED));
            long logoutCount = attendanceRepository.countByAttendanceDateAndStatus(date, AttendanceStatus.COMPLETED);
            long absentCount = Math.max(0, activeEmployees - loginCount);

            Map<String, Object> dayStats = new HashMap<>();
            dayStats.put("date", date.format(formatter));
            dayStats.put("present", loginCount);
            dayStats.put("absent", absentCount);
            dayStats.put("login", loginCount);
            dayStats.put("logout", logoutCount);

            chartData.add(dayStats);
        }

        return chartData;
    }

    public List<Map<String, Object>> getAttendanceReport(Long employeeId, AttendanceStatus status, LocalDate startDate, LocalDate endDate) {
        List<Attendance> attendances = attendanceRepository.findByFilters(employeeId, status, startDate, endDate);
        List<Map<String, Object>> reportList = new ArrayList<>();

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");

        for (Attendance a : attendances) {
            Map<String, Object> record = new HashMap<>();
            record.put("id", a.getId());
            record.put("employeeId", a.getEmployee().getId());
            record.put("employeeCode", a.getEmployee().getEmployeeCode());
            record.put("employeeName", a.getEmployee().getName());
            record.put("date", a.getAttendanceDate().format(dateFormatter));
            record.put("rawDate", a.getAttendanceDate().toString());
            
            record.put("loginTime", a.getLoginTime() != null ? a.getLoginTime().format(timeFormatter) : "--");
            record.put("loginDistance", a.getLoginDistance() != null ? String.format("%.1fm", a.getLoginDistance()) : "--");
            record.put("loginAccuracy", a.getLoginAccuracy() != null ? String.format("%.1fm", a.getLoginAccuracy()) : "--");
            
            record.put("logoutTime", a.getLogoutTime() != null ? a.getLogoutTime().format(timeFormatter) : "--");
            record.put("logoutDistance", a.getLogoutDistance() != null ? String.format("%.1fm", a.getLogoutDistance()) : "--");
            record.put("logoutAccuracy", a.getLogoutAccuracy() != null ? String.format("%.1fm", a.getLogoutAccuracy()) : "--");
            
            record.put("status", a.getStatus().name());
            record.put("timingStatus", a.getTimingStatus() != null ? a.getTimingStatus().name() : "PRESENT");

            // Calculate display status based on priorities
            String displayStatus = "Present";
            if (a.getStatus() == AttendanceStatus.LOGGED_IN) {
                displayStatus = "Working";
            } else if (a.getTimingStatus() == AttendanceTimingStatus.LATE) {
                displayStatus = "Late";
            } else if (a.getTimingStatus() == AttendanceTimingStatus.PERMISSION) {
                displayStatus = "Permission";
            } else if (a.getTimingStatus() == AttendanceTimingStatus.LEAVE) {
                displayStatus = "Leave";
            }
            record.put("displayStatus", displayStatus);

            // Working hours calculation
            if (a.getLoginTime() != null && a.getLogoutTime() != null) {
                Duration duration = Duration.between(a.getLoginTime(), a.getLogoutTime());
                long hours = duration.toHours();
                long minutes = duration.toMinutesPart();
                record.put("workingHours", String.format("%02d:%02d", hours, minutes));
            } else {
                record.put("workingHours", "--");
            }

            reportList.add(record);
        }

        return reportList;
    }

    public Map<String, Object> getMonthlyAttendanceGrid(Integer year, Integer month, Long employeeId) {
        LocalDate today = LocalDate.now(KOLKATA_ZONE);
        int targetYear = (year != null && year > 2000) ? year : today.getYear();
        int targetMonth = (month != null && month >= 1 && month <= 12) ? month : today.getMonthValue();

        YearMonth yearMonth = YearMonth.of(targetYear, targetMonth);
        LocalDate startOfMonth = yearMonth.atDay(1);
        LocalDate endOfMonth = yearMonth.atEndOfMonth();
        int daysInMonth = yearMonth.lengthOfMonth();

        // Fetch target employees
        List<User> employees;
        if (employeeId != null) {
            employees = userRepository.findById(employeeId)
                    .map(Collections::singletonList)
                    .orElse(Collections.emptyList());
        } else {
            employees = userRepository.findByRole(Role.EMPLOYEE);
        }

        // Fetch all attendance for this month
        List<Attendance> monthlyAttendances = attendanceRepository
                .findByAttendanceDateBetweenOrderByAttendanceDateDesc(startOfMonth, endOfMonth);

        // Group attendance by employeeId + date
        Map<String, Attendance> attendanceMap = new HashMap<>();
        for (Attendance att : monthlyAttendances) {
            String key = att.getEmployee().getId() + "_" + att.getAttendanceDate().toString();
            attendanceMap.put(key, att);
        }

        // Fetch all approved leaves in this month
        List<LeaveRequest> approvedLeaves = leaveRepository
                .findApprovedLeavesInDateRange(startOfMonth, endOfMonth, RequestStatus.APPROVED);

        // Fetch all approved permissions in this month
        List<PermissionRequest> approvedPermissions = permissionRepository
                .findByFilters(null, RequestStatus.APPROVED, startOfMonth, endOfMonth);

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm a");

        List<Map<String, Object>> employeeRows = new ArrayList<>();

        for (User emp : employees) {
            Map<String, Object> row = new HashMap<>();
            row.put("employeeId", emp.getId());
            row.put("employeeName", emp.getName());
            row.put("employeeCode", emp.getEmployeeCode());

            int presentCount = 0;
            int lateCount = 0;
            int permissionCount = 0;
            int leaveCount = 0;
            int absentCount = 0;
            int weekOffCount = 0;

            Map<String, Object> daysMap = new HashMap<>();

            for (int day = 1; day <= daysInMonth; day++) {
                LocalDate currentDate = yearMonth.atDay(day);
                String dateStr = currentDate.toString();
                String key = emp.getId() + "_" + dateStr;

                boolean isSunday = currentDate.getDayOfWeek() == DayOfWeek.SUNDAY;
                boolean isFuture = currentDate.isAfter(today);

                // 1. Check Leave
                boolean isOnLeave = approvedLeaves.stream().anyMatch(l ->
                        l.getEmployee().getId().equals(emp.getId()) &&
                        !currentDate.isBefore(l.getFromDate()) &&
                        !currentDate.isAfter(l.getToDate())
                );

                // 2. Check Permission
                boolean hasPermission = approvedPermissions.stream().anyMatch(p ->
                        p.getEmployee().getId().equals(emp.getId()) &&
                        p.getPermissionDate().equals(currentDate)
                );

                // 3. Check Attendance
                Attendance att = attendanceMap.get(key);

                String code;
                String statusName;
                String loginTime = "--";
                String logoutTime = "--";
                String workingHours = "--";

                if (isOnLeave) {
                    code = "LV";
                    statusName = "Leave";
                    leaveCount++;
                } else if (att != null) {
                    if (att.getLoginTime() != null) loginTime = att.getLoginTime().format(timeFmt);
                    if (att.getLogoutTime() != null) logoutTime = att.getLogoutTime().format(timeFmt);
                    if (att.getLoginTime() != null && att.getLogoutTime() != null) {
                        Duration duration = Duration.between(att.getLoginTime(), att.getLogoutTime());
                        workingHours = String.format("%02d:%02d", duration.toHours(), duration.toMinutesPart());
                    }

                    if (att.getTimingStatus() == AttendanceTimingStatus.LATE) {
                        code = "L";
                        statusName = "Late";
                        lateCount++;
                    } else if (att.getTimingStatus() == AttendanceTimingStatus.PERMISSION || hasPermission) {
                        code = "PR";
                        statusName = "Permission";
                        permissionCount++;
                    } else {
                        code = "P";
                        statusName = "Present";
                        presentCount++;
                    }
                } else if (hasPermission) {
                    code = "PR";
                    statusName = "Permission";
                    permissionCount++;
                } else if (isSunday) {
                    code = "WO";
                    statusName = "Week Off";
                    weekOffCount++;
                } else if (isFuture) {
                    code = "--";
                    statusName = "Upcoming";
                } else if (currentDate.equals(today)) {
                    code = "--";
                    statusName = "Not Logged In";
                } else {
                    code = "A";
                    statusName = "Absent";
                    absentCount++;
                }

                Map<String, Object> dayDetail = new HashMap<>();
                dayDetail.put("day", day);
                dayDetail.put("date", dateStr);
                dayDetail.put("code", code);
                dayDetail.put("status", statusName);
                dayDetail.put("loginTime", loginTime);
                dayDetail.put("logoutTime", logoutTime);
                dayDetail.put("workingHours", workingHours);

                daysMap.put(String.valueOf(day), dayDetail);
            }

            row.put("days", daysMap);
            row.put("totalPresent", presentCount);
            row.put("totalLate", lateCount);
            row.put("totalPermission", permissionCount);
            row.put("totalLeave", leaveCount);
            row.put("totalAbsent", absentCount);
            row.put("totalWeekOff", weekOffCount);

            employeeRows.add(row);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("year", targetYear);
        result.put("month", targetMonth);
        result.put("daysInMonth", daysInMonth);
        result.put("employees", employeeRows);

        return result;
    }
}

