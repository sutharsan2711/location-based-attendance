package com.company.attendance.service;

import com.company.attendance.dto.AttendanceRequest;
import com.company.attendance.dto.AttendanceResponse;
import com.company.attendance.entity.Attendance;
import com.company.attendance.entity.CompanyLocation;
import com.company.attendance.entity.User;
import com.company.attendance.enums.AttendanceStatus;
import com.company.attendance.enums.Role;
import com.company.attendance.enums.UserStatus;
import com.company.attendance.exception.LocationValidationException;
import com.company.attendance.repository.AttendanceRepository;
import com.company.attendance.repository.CompanyLocationRepository;
import com.company.attendance.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private CompanyLocationRepository locationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.company.attendance.repository.PermissionRequestRepository permissionRepository;

    @Mock
    private com.company.attendance.repository.LeaveRequestRepository leaveRepository;

    @InjectMocks
    private AttendanceService attendanceService;

    private User activeEmployee;
    private User inactiveEmployee;
    private CompanyLocation defaultLocation;
    private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);

        activeEmployee = new User();
        activeEmployee.setId(1L);
        activeEmployee.setName("John Doe");
        activeEmployee.setEmail("john@company.com");
        activeEmployee.setRole(Role.EMPLOYEE);
        activeEmployee.setStatus(UserStatus.ACTIVE);

        inactiveEmployee = new User();
        inactiveEmployee.setId(2L);
        inactiveEmployee.setName("Jane Smith");
        inactiveEmployee.setEmail("jane@company.com");
        inactiveEmployee.setRole(Role.EMPLOYEE);
        inactiveEmployee.setStatus(UserStatus.INACTIVE);

        defaultLocation = new CompanyLocation("ABC Technologies", 11.123456, 78.123456, 50.0, 100.0);
    }

    @Test
    public void testLoginInsideRadius() {
        when(userRepository.findByEmail("john@company.com")).thenReturn(Optional.of(activeEmployee));
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(1L, LocalDate.now(KOLKATA_ZONE))).thenReturn(Optional.empty());
        when(locationRepository.findAll()).thenReturn(java.util.Collections.singletonList(defaultLocation));

        // Coordinates equal to office location coordinates
        AttendanceRequest request = new AttendanceRequest();
        request.setLatitude(11.123456);
        request.setLongitude(78.123456);
        request.setAccuracy(10.0);

        AttendanceResponse response = attendanceService.loginAttendance("john@company.com", request);

        assertTrue(response.isSuccess());
        assertEquals("LOGGED_IN", response.getStatus());
        assertTrue(response.getDistance() <= 50.0);
        verify(attendanceRepository, times(1)).save(any(Attendance.class));
    }

    @Test
    public void testLoginOutsideRadius() {
        when(userRepository.findByEmail("john@company.com")).thenReturn(Optional.of(activeEmployee));
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(1L, LocalDate.now(KOLKATA_ZONE))).thenReturn(Optional.empty());
        when(locationRepository.findAll()).thenReturn(java.util.Collections.singletonList(defaultLocation));

        // Submit coordinates far away
        AttendanceRequest request = new AttendanceRequest();
        request.setLatitude(12.123456);
        request.setLongitude(79.123456);
        request.setAccuracy(10.0);

        assertThrows(LocationValidationException.class, () -> {
            attendanceService.loginAttendance("john@company.com", request);
        });
    }

    @Test
    public void testDuplicateLogin() {
        Attendance existingAttendance = new Attendance(activeEmployee, LocalDate.now(KOLKATA_ZONE), AttendanceStatus.LOGGED_IN);

        when(userRepository.findByEmail("john@company.com")).thenReturn(Optional.of(activeEmployee));
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(1L, LocalDate.now(KOLKATA_ZONE))).thenReturn(Optional.of(existingAttendance));

        AttendanceRequest request = new AttendanceRequest();
        request.setLatitude(11.123456);
        request.setLongitude(78.123456);
        request.setAccuracy(10.0);

        assertThrows(IllegalStateException.class, () -> {
            attendanceService.loginAttendance("john@company.com", request);
        });
    }

    @Test
    public void testLogoutWithoutLogin() {
        when(userRepository.findByEmail("john@company.com")).thenReturn(Optional.of(activeEmployee));
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(1L, LocalDate.now(KOLKATA_ZONE))).thenReturn(Optional.empty());

        AttendanceRequest request = new AttendanceRequest();
        request.setLatitude(11.123456);
        request.setLongitude(78.123456);
        request.setAccuracy(10.0);

        assertThrows(IllegalStateException.class, () -> {
            attendanceService.logoutAttendance("john@company.com", request);
        });
    }

    @Test
    public void testDuplicateLogout() {
        Attendance completedAttendance = new Attendance(activeEmployee, LocalDate.now(KOLKATA_ZONE), AttendanceStatus.COMPLETED);

        when(userRepository.findByEmail("john@company.com")).thenReturn(Optional.of(activeEmployee));
        when(attendanceRepository.findByEmployeeIdAndAttendanceDate(1L, LocalDate.now(KOLKATA_ZONE))).thenReturn(Optional.of(completedAttendance));

        AttendanceRequest request = new AttendanceRequest();
        request.setLatitude(11.123456);
        request.setLongitude(78.123456);
        request.setAccuracy(10.0);

        assertThrows(IllegalStateException.class, () -> {
            attendanceService.logoutAttendance("john@company.com", request);
        });
    }

    @Test
    public void testInactiveEmployeeLogin() {
        when(userRepository.findByEmail("jane@company.com")).thenReturn(Optional.of(inactiveEmployee));

        AttendanceRequest request = new AttendanceRequest();
        request.setLatitude(11.123456);
        request.setLongitude(78.123456);
        request.setAccuracy(10.0);

        assertThrows(IllegalStateException.class, () -> {
            attendanceService.loginAttendance("jane@company.com", request);
        });
    }
}
