package com.company.attendance.dto;

import com.company.attendance.enums.HalfDaySession;
import com.company.attendance.enums.LeaveType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class LeaveCreateRequest {

    @NotNull(message = "Leave type is required")
    private LeaveType leaveType;

    @NotNull(message = "From date is required")
    private LocalDate fromDate;

    @NotNull(message = "To date is required")
    private LocalDate toDate;

    private Boolean isHalfDay = false;

    private HalfDaySession halfDaySession;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String remarks;

    // Getters and Setters
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
}
