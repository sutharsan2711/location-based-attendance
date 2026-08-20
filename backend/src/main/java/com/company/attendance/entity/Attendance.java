package com.company.attendance.entity;

import com.company.attendance.enums.AttendanceStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "attendance_date"})
})
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "login_time")
    private LocalDateTime loginTime;

    @Column(name = "login_latitude")
    private Double loginLatitude;

    @Column(name = "login_longitude")
    private Double loginLongitude;

    @Column(name = "login_accuracy")
    private Double loginAccuracy;

    @Column(name = "login_distance")
    private Double loginDistance;

    @Column(name = "logout_time")
    private LocalDateTime logoutTime;

    @Column(name = "logout_latitude")
    private Double logoutLatitude;

    @Column(name = "logout_longitude")
    private Double logoutLongitude;

    @Column(name = "logout_accuracy")
    private Double logoutAccuracy;

    @Column(name = "logout_distance")
    private Double logoutDistance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status = AttendanceStatus.NOT_LOGGED_IN;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public Attendance() {}

    public Attendance(User employee, LocalDate attendanceDate, AttendanceStatus status) {
        this.employee = employee;
        this.attendanceDate = attendanceDate;
        this.status = status;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getEmployee() { return employee; }
    public void setEmployee(User employee) { this.employee = employee; }

    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }

    public LocalDateTime getLoginTime() { return loginTime; }
    public void setLoginTime(LocalDateTime loginTime) { this.loginTime = loginTime; }

    public Double getLoginLatitude() { return loginLatitude; }
    public void setLoginLatitude(Double loginLatitude) { this.loginLatitude = loginLatitude; }

    public Double getLoginLongitude() { return loginLongitude; }
    public void setLoginLongitude(Double loginLongitude) { this.loginLongitude = loginLongitude; }

    public Double getLoginAccuracy() { return loginAccuracy; }
    public void setLoginAccuracy(Double loginAccuracy) { this.loginAccuracy = loginAccuracy; }

    public Double getLoginDistance() { return loginDistance; }
    public void setLoginDistance(Double loginDistance) { this.loginDistance = loginDistance; }

    public LocalDateTime getLogoutTime() { return logoutTime; }
    public void setLogoutTime(LocalDateTime logoutTime) { this.logoutTime = logoutTime; }

    public Double getLogoutLatitude() { return logoutLatitude; }
    public void setLogoutLatitude(Double logoutLatitude) { this.logoutLatitude = logoutLatitude; }

    public Double getLogoutLongitude() { return logoutLongitude; }
    public void setLogoutLongitude(Double logoutLongitude) { this.logoutLongitude = logoutLongitude; }

    public Double getLogoutAccuracy() { return logoutAccuracy; }
    public void setLogoutAccuracy(Double logoutAccuracy) { this.logoutAccuracy = logoutAccuracy; }

    public Double getLogoutDistance() { return logoutDistance; }
    public void setLogoutDistance(Double logoutDistance) { this.logoutDistance = logoutDistance; }

    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
