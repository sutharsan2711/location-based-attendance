package com.company.attendance.dto;

import com.company.attendance.entity.SalaryStructure;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class SalaryStructureResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private String department;
    private String role;

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

    private LocalDate effectiveFrom;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SalaryStructureResponse() {}

    public static SalaryStructureResponse fromEntity(SalaryStructure s) {
        SalaryStructureResponse res = new SalaryStructureResponse();
        res.setId(s.getId());
        if (s.getEmployee() != null) {
            res.setEmployeeId(s.getEmployee().getId());
            res.setEmployeeName(s.getEmployee().getName());
            res.setEmployeeCode(s.getEmployee().getEmployeeCode());
            res.setDepartment(s.getEmployee().getDepartment());
            res.setRole(s.getEmployee().getRole() != null ? s.getEmployee().getRole().name() : "");
        }
        res.setBasicSalary(s.getBasicSalary());
        res.setHra(s.getHra());
        res.setDa(s.getDa());
        res.setConveyanceAllowance(s.getConveyanceAllowance());
        res.setMedicalAllowance(s.getMedicalAllowance());
        res.setOtherAllowance(s.getOtherAllowance());
        res.setGrossSalary(s.getGrossSalary());

        res.setPf(s.getPf());
        res.setEsi(s.getEsi());
        res.setProfessionalTax(s.getProfessionalTax());
        res.setOtherDeduction(s.getOtherDeduction());
        res.setTotalDeduction(s.getTotalDeductions());

        res.setNetSalary(s.getNetSalary());
        res.setEffectiveFrom(s.getEffectiveFrom());
        res.setCreatedAt(s.getCreatedAt());
        res.setUpdatedAt(s.getUpdatedAt());
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

    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
