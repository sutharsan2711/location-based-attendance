package com.company.attendance.dto;

import java.time.LocalDateTime;

public class AttendanceResponse {
    private boolean success;
    private String message;
    private Double distance;
    private Double allowedRadius;
    private LocalDateTime time;
    private String status;
    private String timingStatus;

    public AttendanceResponse() {}

    public AttendanceResponse(boolean success, String message, Double distance, Double allowedRadius, LocalDateTime time, String status) {
        this.success = success;
        this.message = message;
        this.distance = distance;
        this.allowedRadius = allowedRadius;
        this.time = time;
        this.status = status;
        this.timingStatus = "PRESENT";
    }

    public AttendanceResponse(boolean success, String message, Double distance, Double allowedRadius, LocalDateTime time, String status, String timingStatus) {
        this.success = success;
        this.message = message;
        this.distance = distance;
        this.allowedRadius = allowedRadius;
        this.time = time;
        this.status = status;
        this.timingStatus = timingStatus;
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

    public String getTimingStatus() { return timingStatus; }
    public void setTimingStatus(String timingStatus) { this.timingStatus = timingStatus; }
}
