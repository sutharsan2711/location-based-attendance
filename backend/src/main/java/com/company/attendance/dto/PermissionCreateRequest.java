package com.company.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public class PermissionCreateRequest {

    @NotNull(message = "Permission date is required")
    private LocalDate permissionDate;

    @NotNull(message = "From time is required")
    private LocalTime fromTime;

    @NotNull(message = "To time is required")
    private LocalTime toTime;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String remarks;

    // Getters and Setters
    public LocalDate getPermissionDate() { return permissionDate; }
    public void setPermissionDate(LocalDate permissionDate) { this.permissionDate = permissionDate; }

    public LocalTime getFromTime() { return fromTime; }
    public void setFromTime(LocalTime fromTime) { this.fromTime = fromTime; }

    public LocalTime getToTime() { return toTime; }
    public void setToTime(LocalTime toTime) { this.toTime = toTime; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
