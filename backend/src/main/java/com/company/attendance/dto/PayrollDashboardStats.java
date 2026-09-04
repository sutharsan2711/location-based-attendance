package com.company.attendance.dto;

public class PayrollDashboardStats {

    private long totalEmployees;
    private long payrollGenerated;
    private long payrollPending;
    private long payrollPaid;
    private int currentMonth;
    private int currentYear;
    private String currentMonthName;

    public PayrollDashboardStats() {}

    public PayrollDashboardStats(long totalEmployees, long payrollGenerated, long payrollPending, long payrollPaid, int currentMonth, int currentYear, String currentMonthName) {
        this.totalEmployees = totalEmployees;
        this.payrollGenerated = payrollGenerated;
        this.payrollPending = payrollPending;
        this.payrollPaid = payrollPaid;
        this.currentMonth = currentMonth;
        this.currentYear = currentYear;
        this.currentMonthName = currentMonthName;
    }

    public long getTotalEmployees() { return totalEmployees; }
    public void setTotalEmployees(long totalEmployees) { this.totalEmployees = totalEmployees; }

    public long getPayrollGenerated() { return payrollGenerated; }
    public void setPayrollGenerated(long payrollGenerated) { this.payrollGenerated = payrollGenerated; }

    public long getPayrollPending() { return payrollPending; }
    public void setPayrollPending(long payrollPending) { this.payrollPending = payrollPending; }

    public long getPayrollPaid() { return payrollPaid; }
    public void setPayrollPaid(long payrollPaid) { this.payrollPaid = payrollPaid; }

    public int getCurrentMonth() { return currentMonth; }
    public void setCurrentMonth(int currentMonth) { this.currentMonth = currentMonth; }

    public int getCurrentYear() { return currentYear; }
    public void setCurrentYear(int currentYear) { this.currentYear = currentYear; }

    public String getCurrentMonthName() { return currentMonthName; }
    public void setCurrentMonthName(String currentMonthName) { this.currentMonthName = currentMonthName; }
}
