package com.company.attendance.dto;

import com.company.attendance.enums.RequestStatus;
import jakarta.validation.constraints.NotNull;

public class RequestStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private RequestStatus status;

    private String adminRemarks;

    // Getters and Setters
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public String getAdminRemarks() { return adminRemarks; }
    public void setAdminRemarks(String adminRemarks) { this.adminRemarks = adminRemarks; }
}
