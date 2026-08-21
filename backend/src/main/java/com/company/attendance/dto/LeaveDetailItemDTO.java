package com.company.attendance.dto;

import java.time.LocalDate;

public class LeaveDetailItemDTO {
    private Long id;
    private LocalDate fromDate;
    private LocalDate toDate;
    private double days;
    private String reason;
    private String status;

    public LeaveDetailItemDTO() {}

    public LeaveDetailItemDTO(Long id, LocalDate fromDate, LocalDate toDate, double days, String reason, String status) {
        this.id = id;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.days = days;
        this.reason = reason;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }

    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }

    public double getDays() { return days; }
    public void setDays(double days) { this.days = days; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
