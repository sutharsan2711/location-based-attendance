package com.company.attendance.service;

import com.company.attendance.dto.AttendanceRequest;
import com.company.attendance.dto.AttendanceResponse;
import com.company.attendance.entity.Attendance;
import com.company.attendance.entity.CompanyLocation;
import com.company.attendance.entity.User;
import com.company.attendance.enums.AttendanceStatus;
import com.company.attendance.enums.UserStatus;
import com.company.attendance.exception.LocationValidationException;
import com.company.attendance.exception.ResourceNotFoundException;
import com.company.attendance.repository.AttendanceRepository;
import com.company.attendance.repository.CompanyLocationRepository;
import com.company.attendance.repository.UserRepository;
import com.company.attendance.util.DistanceCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final CompanyLocationRepository locationRepository;
    private final UserRepository userRepository;

    private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");

    public AttendanceService(AttendanceRepository attendanceRepository,
                             CompanyLocationRepository locationRepository,
                             UserRepository userRepository) {
        this.attendanceRepository = attendanceRepository;
        this.locationRepository = locationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AttendanceResponse loginAttendance(String email, AttendanceRequest request) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));

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

        CompanyLocation location = locationRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException("Company location settings not configured."));

        // Validate accuracy
        if (request.getAccuracy() > location.getMaxGpsAccuracy()) {
            throw new LocationValidationException(
                    "Location accuracy is too low (" + String.format("%.1f", request.getAccuracy()) + " meters). Please enable precise location and try again.",
                    null, null
            );
        }

        // Calculate distance
        double distance = DistanceCalculator.calculateDistance(
                request.getLatitude(), request.getLongitude(),
                location.getLatitude(), location.getLongitude()
        );

        if (distance > location.getAllowedRadius()) {
            throw new LocationValidationException(
                    "You are outside the allowed office location.",
                    distance, location.getAllowedRadius()
            );
        }

        // Create or update attendance record
        Attendance attendance = existingOpt.orElse(new Attendance(employee, today, AttendanceStatus.NOT_LOGGED_IN));
        LocalDateTime now = LocalDateTime.now(KOLKATA_ZONE);
        attendance.setLoginTime(now);
        attendance.setLoginLatitude(request.getLatitude());
        attendance.setLoginLongitude(request.getLongitude());
        attendance.setLoginAccuracy(request.getAccuracy());
        attendance.setLoginDistance(distance);
        attendance.setStatus(AttendanceStatus.LOGGED_IN);

        attendanceRepository.save(attendance);

        return new AttendanceResponse(
                true,
                "Login recorded successfully",
                distance,
                location.getAllowedRadius(),
                now,
                attendance.getStatus().name()
        );
    }

    @Transactional
    public AttendanceResponse logoutAttendance(String email, AttendanceRequest request) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));

        if (employee.getStatus() == UserStatus.INACTIVE) {
            throw new IllegalStateException("Your employee account is inactive.");
        }

        LocalDate today = LocalDate.now(KOLKATA_ZONE);

        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today)
                .orElseThrow(() -> new IllegalStateException("You must login before logout."));

        if (attendance.getStatus() == AttendanceStatus.COMPLETED) {
            throw new IllegalStateException("You have already logged out today.");
        }

        CompanyLocation location = locationRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException("Company location settings not configured."));

        // Validate accuracy
        if (request.getAccuracy() > location.getMaxGpsAccuracy()) {
            throw new LocationValidationException(
                    "Location accuracy is too low (" + String.format("%.1f", request.getAccuracy()) + " meters). Please enable precise location and try again.",
                    null, null
            );
        }

        // Calculate distance
        double distance = DistanceCalculator.calculateDistance(
                request.getLatitude(), request.getLongitude(),
                location.getLatitude(), location.getLongitude()
        );

        if (distance > location.getAllowedRadius()) {
            throw new LocationValidationException(
                    "You are outside the allowed office location.",
                    distance, location.getAllowedRadius()
            );
        }

        LocalDateTime now = LocalDateTime.now(KOLKATA_ZONE);
        attendance.setLogoutTime(now);
        attendance.setLogoutLatitude(request.getLatitude());
        attendance.setLogoutLongitude(request.getLongitude());
        attendance.setLogoutAccuracy(request.getAccuracy());
        attendance.setLogoutDistance(distance);
        attendance.setStatus(AttendanceStatus.COMPLETED);

        attendanceRepository.save(attendance);

        return new AttendanceResponse(
                true,
                "Logout recorded successfully",
                distance,
                location.getAllowedRadius(),
                now,
                attendance.getStatus().name()
        );
    }

    public Attendance getTodayAttendance(String email) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));
        LocalDate today = LocalDate.now(KOLKATA_ZONE);
        return attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today)
                .orElseGet(() -> new Attendance(employee, today, AttendanceStatus.NOT_LOGGED_IN));
    }

    public List<Attendance> getEmployeeAttendanceHistory(String email) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));
        return attendanceRepository.findByEmployeeIdOrderByAttendanceDateDesc(employee.getId());
    }

    public List<Attendance> getEmployeeAttendanceHistoryById(Long employeeId) {
        return attendanceRepository.findByEmployeeIdOrderByAttendanceDateDesc(employeeId);
    }

    public List<Attendance> getAllAttendanceFiltered(Long employeeId, AttendanceStatus status, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByFilters(employeeId, status, startDate, endDate);
    }
}
