package com.company.attendance.service;

import com.company.attendance.entity.Attendance;
import com.company.attendance.entity.User;
import com.company.attendance.enums.AttendanceStatus;
import com.company.attendance.enums.Role;
import com.company.attendance.enums.UserStatus;
import com.company.attendance.repository.AttendanceRepository;
import com.company.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;

    private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");

    public DashboardService(UserRepository userRepository, AttendanceRepository attendanceRepository) {
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
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
        
        long absent = Math.max(0, activeEmployees - todayLogin);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEmployees", totalEmployees);
        stats.put("activeEmployees", activeEmployees);
        stats.put("todayLogin", todayLogin);
        stats.put("todayLogout", todayLogout);
        stats.put("currentlyWorking", currentlyWorking);
        stats.put("absent", absent);

        return stats;
    }

    public List<Map<String, Object>> getAttendanceSummaryCharts() {
        // Return stats for the last 7 days to populate Recharts graphs
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
            record.put("employeeCode", a.getEmployee().getEmployeeCode());
            record.put("employeeName", a.getEmployee().getName());
            record.put("date", a.getAttendanceDate().format(dateFormatter));
            
            record.put("loginTime", a.getLoginTime() != null ? a.getLoginTime().format(timeFormatter) : "--");
            record.put("loginDistance", a.getLoginDistance() != null ? String.format("%.1fm", a.getLoginDistance()) : "--");
            record.put("loginAccuracy", a.getLoginAccuracy() != null ? String.format("%.1fm", a.getLoginAccuracy()) : "--");
            
            record.put("logoutTime", a.getLogoutTime() != null ? a.getLogoutTime().format(timeFormatter) : "--");
            record.put("logoutDistance", a.getLogoutDistance() != null ? String.format("%.1fm", a.getLogoutDistance()) : "--");
            record.put("logoutAccuracy", a.getLogoutAccuracy() != null ? String.format("%.1fm", a.getLogoutAccuracy()) : "--");
            
            record.put("status", a.getStatus().name());

            // Working hours calculation: duration between login and logout
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
}
