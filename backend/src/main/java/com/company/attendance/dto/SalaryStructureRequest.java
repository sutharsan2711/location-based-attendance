package com.company.attendance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class SalaryStructureRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Basic salary is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Basic salary cannot be negative")
    private BigDecimal basicSalary;

    @DecimalMin(value = "0.0", inclusive = true, message = "HRA cannot be negative")
    private BigDecimal hra = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "DA cannot be negative")
    private BigDecimal da = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "Conveyance allowance cannot be negative")
    private BigDecimal conveyanceAllowance = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "Medical allowance cannot be negative")
    private BigDecimal medicalAllowance = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "Other allowance cannot be negative")
    private BigDecimal otherAllowance = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "PF deduction cannot be negative")
    private BigDecimal pf = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "ESI deduction cannot be negative")
    private BigDecimal esi = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "Professional Tax cannot be negative")
    private BigDecimal professionalTax = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "Other deduction cannot be negative")
    private BigDecimal otherDeduction = BigDecimal.ZERO;

    private LocalDate effectiveFrom;

    public SalaryStructureRequest() {}

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

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

    public BigDecimal getPf() { return pf; }
    public void setPf(BigDecimal pf) { this.pf = pf; }

    public BigDecimal getEsi() { return esi; }
    public void setEsi(BigDecimal esi) { this.esi = esi; }

    public BigDecimal getProfessionalTax() { return professionalTax; }
    public void setProfessionalTax(BigDecimal professionalTax) { this.professionalTax = professionalTax; }

    public BigDecimal getOtherDeduction() { return otherDeduction; }
    public void setOtherDeduction(BigDecimal otherDeduction) { this.otherDeduction = otherDeduction; }

    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }
}
