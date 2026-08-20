package com.company.attendance.dto;

import java.time.LocalDateTime;

public class AttendanceResponse {
    private boolean success;
    private String message;
    private Double distance;
    private Double allowedRadius;
    private LocalDateTime time;
    private String status;

    public AttendanceResponse() {}

    public AttendanceResponse(boolean success, String message, Double distance, Double allowedRadius, LocalDateTime time, String status) {
        this.success = success;
        this.message = message;
        this.distance = distance;
        this.allowedRadius = allowedRadius;
        this.time = time;
        this.status = status;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Double getDistance() { return distance; }
    public void setDistance(Double distance) { this.distance = distance; }

    public Double getAllowedRadius() { return allowedRadius; }
    public void setAllowedRadius(Double allowedRadius) { this.allowedRadius = allowedRadius; }

    public LocalDateTime getTime() { return time; }
    public void setTime(LocalDateTime time) { this.time = time; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
