package com.company.attendance.dto;

import com.company.attendance.entity.CompanyLocation;
import com.company.attendance.entity.Payroll;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PayslipResponse {

    private Long payrollId;

    // Company Information
    private String companyName;
    private String companyAddress;

    // Employee Information
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private String department;
    private String designation;
    private String role;
    private String joiningDate;

    // Period
    private Integer month;
    private Integer year;
    private String monthName;

    // Earnings
    private BigDecimal basicSalary;
    private BigDecimal hra;
    private BigDecimal da;
    private BigDecimal conveyanceAllowance;
    private BigDecimal medicalAllowance;
    private BigDecimal otherAllowance;
    private BigDecimal grossSalary;

    // Deductions
    private BigDecimal pf;
    private BigDecimal esi;
    private BigDecimal professionalTax;
    private BigDecimal otherDeduction;
    private BigDecimal totalDeduction;

    // Net Pay
    private BigDecimal netSalary;

    // Attendance Summary
    private Integer workingDays;
    private Integer presentDays;
    private Integer absentDays;
    private Integer leaveDays;
    private Integer permissionDays;
    private Integer lateDays;

    private String status;
    private LocalDateTime generatedAt;
    private LocalDateTime paidAt;

    public PayslipResponse() {}

    public static PayslipResponse fromEntity(Payroll p, CompanyLocation companyLoc) {
        PayslipResponse ps = new PayslipResponse();
        ps.setPayrollId(p.getId());

        // Company
        if (companyLoc != null && companyLoc.getCompanyName() != null) {
            ps.setCompanyName(companyLoc.getCompanyName());
            ps.setCompanyAddress("Corporate Office Campus");
        } else {
            ps.setCompanyName("ABC Technologies");
            ps.setCompanyAddress("Corporate Office Campus");
        }

        // Employee
        if (p.getEmployee() != null) {
            ps.setEmployeeId(p.getEmployee().getId());
            ps.setEmployeeName(p.getEmployee().getName());
            ps.setEmployeeCode(p.getEmployee().getEmployeeCode());
            ps.setDepartment(p.getEmployee().getDepartment() != null ? p.getEmployee().getDepartment() : "General");
            ps.setRole(p.getEmployee().getRole() != null ? p.getEmployee().getRole().name() : "");
            
            // Extract designation / joiningDate from profileData if available
            ps.setDesignation(p.getEmployee().getDepartment());
            if (p.getEmployee().getCreatedAt() != null) {
                ps.setJoiningDate(p.getEmployee().getCreatedAt().toLocalDate().toString());
            }
        }

        ps.setMonth(p.getMonth());
        ps.setYear(p.getYear());
        ps.setMonthName(java.time.Month.of(p.getMonth()).name());

        // Financials
        ps.setBasicSalary(p.getBasicSalary());
        ps.setHra(p.getHra());
        ps.setDa(p.getDa());
        ps.setConveyanceAllowance(p.getConveyanceAllowance());
        ps.setMedicalAllowance(p.getMedicalAllowance());
        ps.setOtherAllowance(p.getOtherAllowance());
        ps.setGrossSalary(p.getGrossSalary());

        ps.setPf(p.getPf());
        ps.setEsi(p.getEsi());
        ps.setProfessionalTax(p.getProfessionalTax());
        ps.setOtherDeduction(p.getOtherDeduction());
        ps.setTotalDeduction(p.getTotalDeduction());

        ps.setNetSalary(p.getNetSalary());

        // Attendance
        ps.setWorkingDays(p.getWorkingDays());
        ps.setPresentDays(p.getPresentDays());
        ps.setAbsentDays(p.getAbsentDays());
        ps.setLeaveDays(p.getLeaveDays());
        ps.setPermissionDays(p.getPermissionDays());
        ps.setLateDays(p.getLateDays());

        ps.setStatus(p.getStatus() != null ? p.getStatus().name() : "GENERATED");
        ps.setGeneratedAt(p.getGeneratedAt());
        ps.setPaidAt(p.getPaidAt());

        return ps;
    }

    // Getters and Setters
    public Long getPayrollId() { return payrollId; }
    public void setPayrollId(Long payrollId) { this.payrollId = payrollId; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getCompanyAddress() { return companyAddress; }
    public void setCompanyAddress(String companyAddress) { this.companyAddress = companyAddress; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getJoiningDate() { return joiningDate; }
    public void setJoiningDate(String joiningDate) { this.joiningDate = joiningDate; }

    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getMonthName() { return monthName; }
    public void setMonthName(String monthName) { this.monthName = monthName; }

    public BigDecimal getBasicSalary() { return basicSalary; }
    public void setBasicSalary(BigDecimal basicSalary) { this.basicSalary = basicSalary; }

    public BigDecimal getHra() { return hra; }
    public void setHra(BigDecimal hra) { this.hra = hra; }

    public BigDecimal getDa() { return da; }
    public void setDa(BigDecimal da) { this.da = da; }

    public BigDecimal getConveyanceAllowance() { return conveyanceAllowance; }
    public void setConveyanceAllowance(BigDecimal conveyanceAllowance) { this.conveyanceAllowance = conveyanceAllowance; }

    public BigDecimal getMedicalAllowance() { return medicalAllowance; }
    public void setMedicalAllowance(BigDecimal medicalAllowance) { this.medicalAllowance = medicalAllowance; }

    public BigDecimal getOtherAllowance() { return otherAllowance; }
    public void setOtherAllowance(BigDecimal otherAllowance) { this.otherAllowance = otherAllowance; }

    public BigDecimal getGrossSalary() { return grossSalary; }
    public void setGrossSalary(BigDecimal grossSalary) { this.grossSalary = grossSalary; }

    public BigDecimal getPf() { return pf; }
    public void setPf(BigDecimal pf) { this.pf = pf; }

    public BigDecimal getEsi() { return esi; }
    public void setEsi(BigDecimal esi) { this.esi = esi; }

    public BigDecimal getProfessionalTax() { return professionalTax; }
    public void setProfessionalTax(BigDecimal professionalTax) { this.professionalTax = professionalTax; }

    public BigDecimal getOtherDeduction() { return otherDeduction; }
    public void setOtherDeduction(BigDecimal otherDeduction) { this.otherDeduction = otherDeduction; }

    public BigDecimal getTotalDeduction() { return totalDeduction; }
    public void setTotalDeduction(BigDecimal totalDeduction) { this.totalDeduction = totalDeduction; }

    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }

    public Integer getWorkingDays() { return workingDays; }
    public void setWorkingDays(Integer workingDays) { this.workingDays = workingDays; }

    public Integer getPresentDays() { return presentDays; }
    public void setPresentDays(Integer presentDays) { this.presentDays = presentDays; }

    public Integer getAbsentDays() { return absentDays; }
    public void setAbsentDays(Integer absentDays) { this.absentDays = absentDays; }

    public Integer getLeaveDays() { return leaveDays; }
    public void setLeaveDays(Integer leaveDays) { this.leaveDays = leaveDays; }

    public Integer getPermissionDays() { return permissionDays; }
    public void setPermissionDays(Integer permissionDays) { this.permissionDays = permissionDays; }

    public Integer getLateDays() { return lateDays; }
    public void setLateDays(Integer lateDays) { this.lateDays = lateDays; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
