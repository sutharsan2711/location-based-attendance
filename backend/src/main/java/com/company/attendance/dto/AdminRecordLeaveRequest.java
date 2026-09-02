package com.company.attendance.dto;

import com.company.attendance.enums.LeaveType;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class AdminRecordLeaveRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Leave Type is required")
    private LeaveType leaveType;

    @NotNull(message = "From Date is required")
    private LocalDate fromDate;

    @NotNull(message = "To Date is required")
    private LocalDate toDate;

    @NotNull(message = "Reason is required")
    private String reason;

    private String adminRemarks;

    private Boolean isUnapplied;

    public AdminRecordLeaveRequest() {}

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public LeaveType getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(LeaveType leaveType) {
        this.leaveType = leaveType;
    }

    public LocalDate getFromDate() {
        return fromDate;
    }

    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public LocalDate getToDate() {
        return toDate;
    }

    public void setToDate(LocalDate toDate) {
        this.toDate = toDate;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getAdminRemarks() {
        return adminRemarks;
    }

    public void setAdminRemarks(String adminRemarks) {
        this.adminRemarks = adminRemarks;
    }

    public Boolean getIsUnapplied() {
        return isUnapplied;
    }

    public void setIsUnapplied(Boolean isUnapplied) {
        this.isUnapplied = isUnapplied;
    }
}
