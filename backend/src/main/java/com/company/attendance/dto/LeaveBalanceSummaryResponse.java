package com.company.attendance.dto;

import java.util.ArrayList;
import java.util.List;

public class LeaveBalanceSummaryResponse {
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private int year;
    private List<LeaveBalanceItemDTO> balances = new ArrayList<>();

    public LeaveBalanceSummaryResponse() {}

    public LeaveBalanceSummaryResponse(Long employeeId, String employeeName, String employeeCode, int year, List<LeaveBalanceItemDTO> balances) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeCode = employeeCode;
        this.year = year;
        this.balances = balances;
    }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public List<LeaveBalanceItemDTO> getBalances() { return balances; }
    public void setBalances(List<LeaveBalanceItemDTO> balances) { this.balances = balances; }
}
