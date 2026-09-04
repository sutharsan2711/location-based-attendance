package com.company.attendance.service;

import com.company.attendance.dto.AttendanceRequest;
import com.company.attendance.dto.AttendanceResponse;
import com.company.attendance.entity.Attendance;
import com.company.attendance.entity.CompanyLocation;
import com.company.attendance.entity.PermissionRequest;
import com.company.attendance.entity.User;
import com.company.attendance.enums.AttendanceStatus;
import com.company.attendance.enums.AttendanceTimingStatus;
import com.company.attendance.enums.RequestStatus;
import com.company.attendance.enums.UserStatus;
import com.company.attendance.exception.LocationValidationException;
import com.company.attendance.exception.ResourceNotFoundException;
import com.company.attendance.repository.AttendanceRepository;
import com.company.attendance.repository.CompanyLocationRepository;
import com.company.attendance.repository.PermissionRequestRepository;
import com.company.attendance.repository.UserRepository;
import com.company.attendance.util.DistanceCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final CompanyLocationRepository locationRepository;
    private final UserRepository userRepository;
    private final PermissionRequestRepository permissionRepository;

    private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");

    public AttendanceService(AttendanceRepository attendanceRepository,
                             CompanyLocationRepository locationRepository,
                             UserRepository userRepository,
                             PermissionRequestRepository permissionRepository) {
        this.attendanceRepository = attendanceRepository;
        this.locationRepository = locationRepository;
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
    }


    @Transactional
    public AttendanceResponse loginAttendance(String email, AttendanceRequest request) {
        User employee = userRepository.findByEmail(email)
                .or(() -> userRepository.findByEmployeeCode(email))
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email/code: " + email));

        if (employee.getStatus() == UserStatus.INACTIVE) {
            throw new IllegalStateException("Your employee account is inactive.");
        }

        LocalDate today = LocalDate.now(KOLKATA_ZONE);

        // Check if already logged in today
        Optional<Attendance> existingOpt = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today);
        if (existingOpt.isPresent()) {
            Attendance existing = existingOpt.get();
            if (existing.getStatus() == AttendanceStatus.LOGGED_IN || existing.getStatus() == AttendanceStatus.COMPLETED) {
                throw new IllegalStateException("You have already logged in today.");
            }
        }

        List<CompanyLocation> locations = locationRepository.findAll();
        if (locations.isEmpty()) {
            throw new ResourceNotFoundException("Company location settings not configured.");
        }

        // Find nearest location and check if inside ANY location boundary
        CompanyLocation matchedLocation = null;
        double minDistance = Double.MAX_VALUE;
        CompanyLocation nearestLocation = locations.get(0);

        for (CompanyLocation loc : locations) {
            double dist = DistanceCalculator.calculateDistance(
                    request.getLatitude(), request.getLongitude(),
                    loc.getLatitude(), loc.getLongitude()
            );
            if (dist < minDistance) {
                minDistance = dist;
                nearestLocation = loc;
            }
            if (dist <= loc.getAllowedRadius()) {
                matchedLocation = loc;
                minDistance = dist;
                break;
            }
        }

        CompanyLocation location = matchedLocation != null ? matchedLocation : nearestLocation;

        // Validate accuracy
        if (request.getAccuracy() > location.getMaxGpsAccuracy()) {
            throw new LocationValidationException(
                    "Location accuracy is too low (" + String.format("%.1f", request.getAccuracy()) + " meters). Please enable precise location and try again.",
                    null, null
            );
        }

        if (matchedLocation == null) {
            throw new LocationValidationException(
                    "You are outside the allowed office location (" + String.format("%.1f", minDistance) + "m from " + nearestLocation.getCompanyName() + ").",
                    minDistance, nearestLocation.getAllowedRadius()
            );
        }

        // Create or update attendance record
        Attendance attendance = existingOpt.orElse(new Attendance(employee, today, AttendanceStatus.NOT_LOGGED_IN));
        LocalDateTime now = LocalDateTime.now(KOLKATA_ZONE);
        attendance.setLoginTime(now);
        attendance.setLoginLatitude(request.getLatitude());
        attendance.setLoginLongitude(request.getLongitude());
        attendance.setLoginAccuracy(request.getAccuracy());
        attendance.setLoginDistance(minDistance);
        attendance.setStatus(AttendanceStatus.LOGGED_IN);

        LocalTime loginLocalTime = now.toLocalTime();

        // Determine Team Shift Timings for employee
        String dept = employee.getDepartment();
        if (dept == null && employee.getProfileData() != null) {
            if (employee.getProfileData().toLowerCase().contains("edtech")) dept = "EDTECH";
            else if (employee.getProfileData().toLowerCase().contains("business")) dept = "BUSINESS_SOLUTION";
            else if (employee.getProfileData().toLowerCase().contains("it")) dept = "IT";
        }
        if (dept == null) dept = "IT";

        LocalTime shiftLoginTime;
        int graceMinutes;

        if (dept.equalsIgnoreCase("EDTECH")) {
            shiftLoginTime = location.getEdtechLoginTime() != null ? location.getEdtechLoginTime() : LocalTime.of(8, 45);
            graceMinutes = location.getEdtechGraceMinutes() != null ? location.getEdtechGraceMinutes() : 15;
        } else if (dept.equalsIgnoreCase("BUSINESS_SOLUTION") || dept.equalsIgnoreCase("BUSINESS") || dept.toLowerCase().contains("business")) {
            shiftLoginTime = location.getBusinessLoginTime() != null ? location.getBusinessLoginTime() : LocalTime.of(8, 45);
            graceMinutes = location.getBusinessGraceMinutes() != null ? location.getBusinessGraceMinutes() : 15;
        } else {
            // IT Team default
            shiftLoginTime = location.getItLoginTime() != null ? location.getItLoginTime() : LocalTime.of(9, 0);
            graceMinutes = location.getItGraceMinutes() != null ? location.getItGraceMinutes() : 15;
        }

        LocalTime lateThreshold = shiftLoginTime.plusMinutes(graceMinutes);

        // Check if employee has an approved permission for today that covers current login time
        List<PermissionRequest> approvedPermissions = permissionRepository
                .findByEmployeeIdAndPermissionDateAndStatus(employee.getId(), today, RequestStatus.APPROVED);

        boolean coveredByPermission = approvedPermissions.stream().anyMatch(p ->
                !loginLocalTime.isBefore(p.getFromTime()) && !loginLocalTime.isAfter(p.getToTime())
        );

        AttendanceTimingStatus timingStatus;
        if (coveredByPermission) {
            timingStatus = AttendanceTimingStatus.PERMISSION;
        } else if (!loginLocalTime.isAfter(lateThreshold)) {
            timingStatus = AttendanceTimingStatus.PRESENT;
        } else {
            timingStatus = AttendanceTimingStatus.LATE;
        }

        attendance.setTimingStatus(timingStatus);
        attendanceRepository.save(attendance);

        String statusMessage = timingStatus == AttendanceTimingStatus.LATE 
                ? "Login recorded (LATE)" 
                : (timingStatus == AttendanceTimingStatus.PERMISSION ? "Login recorded (PERMISSION)" : "Login recorded successfully");

        return new AttendanceResponse(
                true,
                statusMessage,
                minDistance,
                location.getAllowedRadius(),
                now,
                attendance.getStatus().name(),
                timingStatus.name()
        );
    }

    @Transactional
    public AttendanceResponse logoutAttendance(String email, AttendanceRequest request) {
        User employee = userRepository.findByEmail(email)
                .or(() -> userRepository.findByEmployeeCode(email))
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email/code: " + email));

        if (employee.getStatus() == UserStatus.INACTIVE) {
            throw new IllegalStateException("Your employee account is inactive.");
        }

        LocalDate today = LocalDate.now(KOLKATA_ZONE);

        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today)
                .orElseThrow(() -> new IllegalStateException("You must login before logout."));

        if (attendance.getStatus() == AttendanceStatus.COMPLETED) {
            throw new IllegalStateException("You have already logged out today.");
        }

        List<CompanyLocation> locations = locationRepository.findAll();
        if (locations.isEmpty()) {
            throw new ResourceNotFoundException("Company location settings not configured.");
        }

        // Find nearest location and check if inside ANY location boundary
        CompanyLocation matchedLocation = null;
        double minDistance = Double.MAX_VALUE;
        CompanyLocation nearestLocation = locations.get(0);

        for (CompanyLocation loc : locations) {
            double dist = DistanceCalculator.calculateDistance(
                    request.getLatitude(), request.getLongitude(),
                    loc.getLatitude(), loc.getLongitude()
            );
            if (dist < minDistance) {
                minDistance = dist;
                nearestLocation = loc;
            }
            if (dist <= loc.getAllowedRadius()) {
                matchedLocation = loc;
                minDistance = dist;
                break;
            }
        }

        CompanyLocation location = matchedLocation != null ? matchedLocation : nearestLocation;

        // Validate accuracy
        if (request.getAccuracy() > location.getMaxGpsAccuracy()) {
            throw new LocationValidationException(
                    "Location accuracy is too low (" + String.format("%.1f", request.getAccuracy()) + " meters). Please enable precise location and try again.",
                    null, null
            );
        }

        if (matchedLocation == null) {
            throw new LocationValidationException(
                    "You are outside the allowed office location (" + String.format("%.1f", minDistance) + "m from " + nearestLocation.getCompanyName() + ").",
                    minDistance, nearestLocation.getAllowedRadius()
            );
        }

        LocalDateTime now = LocalDateTime.now(KOLKATA_ZONE);
        attendance.setLogoutTime(now);
        attendance.setLogoutLatitude(request.getLatitude());
        attendance.setLogoutLongitude(request.getLongitude());
        attendance.setLogoutAccuracy(request.getAccuracy());
        attendance.setLogoutDistance(minDistance);
        attendance.setStatus(AttendanceStatus.COMPLETED);

        attendanceRepository.save(attendance);

        return new AttendanceResponse(
                true,
                "Logout recorded successfully",
                minDistance,
                location.getAllowedRadius(),
                now,
                attendance.getStatus().name()
        );
    }

    public Attendance getTodayAttendance(String email) {
        User employee = userRepository.findByEmail(email)
                .or(() -> userRepository.findByEmployeeCode(email))
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email/code: " + email));
        LocalDate today = LocalDate.now(KOLKATA_ZONE);
        return attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today)
                .orElseGet(() -> new Attendance(employee, today, AttendanceStatus.NOT_LOGGED_IN));
    }

    public List<Attendance> getEmployeeAttendanceHistory(String email) {
        User employee = userRepository.findByEmail(email)
                .or(() -> userRepository.findByEmployeeCode(email))
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email/code: " + email));
        return attendanceRepository.findByEmployeeIdOrderByAttendanceDateDesc(employee.getId());
    }

    public List<Attendance> getEmployeeAttendanceHistoryById(Long employeeId) {
        return attendanceRepository.findByEmployeeIdOrderByAttendanceDateDesc(employeeId);
    }

    public List<Attendance> getAllAttendanceFiltered(Long employeeId, AttendanceStatus status, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByFilters(employeeId, status, startDate, endDate);
    }
}
