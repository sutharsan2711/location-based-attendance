package com.company.attendance.entity;

import com.company.attendance.enums.HalfDaySession;
import com.company.attendance.enums.LeaveType;
import com.company.attendance.enums.RequestStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", nullable = false, length = 50)
    private LeaveType leaveType;

    @Column(name = "from_date", nullable = false)
    private LocalDate fromDate;

    @Column(name = "to_date", nullable = false)
    private LocalDate toDate;

    @Column(name = "is_half_day", nullable = false)
    private Boolean isHalfDay = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "half_day_session", length = 30)
    private HalfDaySession halfDaySession;

    @Column(nullable = false)
    private String reason;

    @Column
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "admin_remarks")
    private String adminRemarks;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public LeaveRequest() {}

    public LeaveRequest(User employee, LeaveType leaveType, LocalDate fromDate, LocalDate toDate, String reason, String remarks) {
        this.employee = employee;
        this.leaveType = leaveType;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.reason = reason;
        this.remarks = remarks;
        this.isHalfDay = false;
        this.status = RequestStatus.PENDING;
    }

    public LeaveRequest(User employee, LeaveType leaveType, LocalDate fromDate, LocalDate toDate, Boolean isHalfDay, HalfDaySession halfDaySession, String reason, String remarks) {
        this.employee = employee;
        this.leaveType = leaveType;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.isHalfDay = isHalfDay != null ? isHalfDay : false;
        this.halfDaySession = halfDaySession;
        this.reason = reason;
        this.remarks = remarks;
        this.status = RequestStatus.PENDING;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = RequestStatus.PENDING;
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

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }

    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }

    public Boolean getIsHalfDay() { return isHalfDay != null ? isHalfDay : false; }
    public void setIsHalfDay(Boolean isHalfDay) { this.isHalfDay = isHalfDay != null ? isHalfDay : false; }

    public HalfDaySession getHalfDaySession() { return halfDaySession; }
    public void setHalfDaySession(HalfDaySession halfDaySession) { this.halfDaySession = halfDaySession; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public String getAdminRemarks() { return adminRemarks; }
    public void setAdminRemarks(String adminRemarks) { this.adminRemarks = adminRemarks; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
