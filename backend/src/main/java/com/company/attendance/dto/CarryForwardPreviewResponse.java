package com.company.attendance.dto;

import java.util.ArrayList;
import java.util.List;

public class CarryForwardPreviewResponse {

    private int fromYear;
    private int toYear;
    private int totalEmployees;
    private double totalDaysCarriedForward;
    private List<CarryForwardEmployeeItem> employees = new ArrayList<>();

    public CarryForwardPreviewResponse() {}

    public static class CarryForwardEmployeeItem {
        private Long employeeId;
        private String employeeName;
        private String employeeCode;
        private double casualClosing;
        private double casualCarried;
        private double sickClosing;
        private double sickCarried;
        private double compOffClosing;
        private double compOffCarried;
        private double totalCarried;

        public CarryForwardEmployeeItem() {}

        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

        public String getEmployeeCode() { return employeeCode; }
        public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

        public double getCasualClosing() { return casualClosing; }
        public void setCasualClosing(double casualClosing) { this.casualClosing = casualClosing; }

        public double getCasualCarried() { return casualCarried; }
        public void setCasualCarried(double casualCarried) { this.casualCarried = casualCarried; }

        public double getSickClosing() { return sickClosing; }
        public void setSickClosing(double sickClosing) { this.sickClosing = sickClosing; }

        public double getSickCarried() { return sickCarried; }
        public void setSickCarried(double sickCarried) { this.sickCarried = sickCarried; }

        public double getCompOffClosing() { return compOffClosing; }
        public void setCompOffClosing(double compOffClosing) { this.compOffClosing = compOffClosing; }

        public double getCompOffCarried() { return compOffCarried; }
        public void setCompOffCarried(double compOffCarried) { this.compOffCarried = compOffCarried; }

        public double getTotalCarried() { return totalCarried; }
        public void setTotalCarried(double totalCarried) { this.totalCarried = totalCarried; }
    }

    public int getFromYear() { return fromYear; }
    public void setFromYear(int fromYear) { this.fromYear = fromYear; }

    public int getToYear() { return toYear; }
    public void setToYear(int toYear) { this.toYear = toYear; }

    public int getTotalEmployees() { return totalEmployees; }
    public void setTotalEmployees(int totalEmployees) { this.totalEmployees = totalEmployees; }

    public double getTotalDaysCarriedForward() { return totalDaysCarriedForward; }
    public void setTotalDaysCarriedForward(double totalDaysCarriedForward) { this.totalDaysCarriedForward = totalDaysCarriedForward; }

    public List<CarryForwardEmployeeItem> getEmployees() { return employees; }
    public void setEmployees(List<CarryForwardEmployeeItem> employees) { this.employees = employees; }
}
