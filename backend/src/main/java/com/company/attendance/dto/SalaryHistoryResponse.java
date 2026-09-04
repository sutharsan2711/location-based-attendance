package com.company.attendance.dto;

import com.company.attendance.entity.SalaryHistory;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class SalaryHistoryResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private BigDecimal basicSalary;
    private BigDecimal grossSalary;
    private BigDecimal totalDeduction;
    private BigDecimal netSalary;
    private LocalDate effectiveFrom;
    private LocalDateTime createdAt;

    public SalaryHistoryResponse() {}

    public static SalaryHistoryResponse fromEntity(SalaryHistory h) {
        SalaryHistoryResponse res = new SalaryHistoryResponse();
        res.setId(h.getId());
        if (h.getEmployee() != null) {
            res.setEmployeeId(h.getEmployee().getId());
            res.setEmployeeName(h.getEmployee().getName());
        }
        res.setBasicSalary(h.getBasicSalary());
        res.setGrossSalary(h.getGrossSalary());
        res.setTotalDeduction(h.getTotalDeduction());
        res.setNetSalary(h.getNetSalary());
        res.setEffectiveFrom(h.getEffectiveFrom());
        res.setCreatedAt(h.getCreatedAt());
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public BigDecimal getBasicSalary() { return basicSalary; }
    public void setBasicSalary(BigDecimal basicSalary) { this.basicSalary = basicSalary; }

    public BigDecimal getGrossSalary() { return grossSalary; }
    public void setGrossSalary(BigDecimal grossSalary) { this.grossSalary = grossSalary; }

    public BigDecimal getTotalDeduction() { return totalDeduction; }
    public void setTotalDeduction(BigDecimal totalDeduction) { this.totalDeduction = totalDeduction; }

    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }

    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
