package com.company.attendance.dto;

public class LeaveGrantUpdateRequest {
    private Long employeeId;
    private int year;
    private double casualLeaveGranted;
    private double sickLeaveGranted;
    private double compOffGranted;
    private double lossOfPayGranted;
    private double workFromHomeGranted;

    public LeaveGrantUpdateRequest() {}

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public double getCasualLeaveGranted() { return casualLeaveGranted; }
    public void setCasualLeaveGranted(double casualLeaveGranted) { this.casualLeaveGranted = casualLeaveGranted; }

    public double getSickLeaveGranted() { return sickLeaveGranted; }
    public void setSickLeaveGranted(double sickLeaveGranted) { this.sickLeaveGranted = sickLeaveGranted; }

    public double getCompOffGranted() { return compOffGranted; }
    public void setCompOffGranted(double compOffGranted) { this.compOffGranted = compOffGranted; }

    public double getLossOfPayGranted() { return lossOfPayGranted; }
    public void setLossOfPayGranted(double lossOfPayGranted) { this.lossOfPayGranted = lossOfPayGranted; }

    public double getWorkFromHomeGranted() { return workFromHomeGranted; }
    public void setWorkFromHomeGranted(double workFromHomeGranted) { this.workFromHomeGranted = workFromHomeGranted; }
}
