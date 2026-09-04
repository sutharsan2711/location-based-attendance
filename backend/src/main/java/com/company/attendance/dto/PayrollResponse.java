package com.company.attendance.dto;

import com.company.attendance.entity.Payroll;
import com.company.attendance.enums.PayrollStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PayrollResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private String department;
    private String role;

    private Integer month;
    private Integer year;

    private BigDecimal basicSalary;
    private BigDecimal hra;
    private BigDecimal da;
    private BigDecimal conveyanceAllowance;
    private BigDecimal medicalAllowance;
    private BigDecimal otherAllowance;
    private BigDecimal grossSalary;

    private BigDecimal pf;
    private BigDecimal esi;
    private BigDecimal professionalTax;
    private BigDecimal otherDeduction;
    private BigDecimal totalDeduction;

    private BigDecimal netSalary;

    private Integer workingDays;
    private Integer presentDays;
    private Integer absentDays;
    private Integer leaveDays;
    private Integer permissionDays;
    private Integer lateDays;

    private PayrollStatus status;
    private LocalDateTime generatedAt;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PayrollResponse() {}

    public static PayrollResponse fromEntity(Payroll p) {
        PayrollResponse res = new PayrollResponse();
        res.setId(p.getId());
        if (p.getEmployee() != null) {
            res.setEmployeeId(p.getEmployee().getId());
            res.setEmployeeName(p.getEmployee().getName());
            res.setEmployeeCode(p.getEmployee().getEmployeeCode());
            res.setDepartment(p.getEmployee().getDepartment());
            res.setRole(p.getEmployee().getRole() != null ? p.getEmployee().getRole().name() : "");
        }
        res.setMonth(p.getMonth());
        res.setYear(p.getYear());

        res.setBasicSalary(p.getBasicSalary());
        res.setHra(p.getHra());
        res.setDa(p.getDa());
        res.setConveyanceAllowance(p.getConveyanceAllowance());
        res.setMedicalAllowance(p.getMedicalAllowance());
        res.setOtherAllowance(p.getOtherAllowance());
        res.setGrossSalary(p.getGrossSalary());

        res.setPf(p.getPf());
        res.setEsi(p.getEsi());
        res.setProfessionalTax(p.getProfessionalTax());
        res.setOtherDeduction(p.getOtherDeduction());
        res.setTotalDeduction(p.getTotalDeduction());

        res.setNetSalary(p.getNetSalary());

        res.setWorkingDays(p.getWorkingDays());
        res.setPresentDays(p.getPresentDays());
        res.setAbsentDays(p.getAbsentDays());
        res.setLeaveDays(p.getLeaveDays());
        res.setPermissionDays(p.getPermissionDays());
        res.setLateDays(p.getLateDays());

        res.setStatus(p.getStatus());
        res.setGeneratedAt(p.getGeneratedAt());
        res.setPaidAt(p.getPaidAt());
        res.setCreatedAt(p.getCreatedAt());
        res.setUpdatedAt(p.getUpdatedAt());
        return res;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

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

    public PayrollStatus getStatus() { return status; }
    public void setStatus(PayrollStatus status) { this.status = status; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
