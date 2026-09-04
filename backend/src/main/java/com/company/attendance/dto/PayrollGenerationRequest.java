package com.company.attendance.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class PayrollGenerationRequest {

    @NotNull(message = "Month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    private Integer month;

    @NotNull(message = "Year is required")
    @Min(value = 2020, message = "Year must be valid")
    @Max(value = 2100, message = "Year must be valid")
    private Integer year;

    private Long employeeId; // Optional: If specified, generates for single employee

    public PayrollGenerationRequest() {}

    public PayrollGenerationRequest(Integer month, Integer year) {
        this.month = month;
        this.year = year;
    }

    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
}
