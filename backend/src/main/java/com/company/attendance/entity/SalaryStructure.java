package com.company.attendance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_structure")
public class SalaryStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private User employee;

    // ── Allowances / Earnings ──
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal basicSalary = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal hra = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal da = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal conveyanceAllowance = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal medicalAllowance = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal otherAllowance = BigDecimal.ZERO;

    // ── Deductions ──
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pf = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal esi = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal professionalTax = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal otherDeduction = BigDecimal.ZERO;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom = LocalDate.now();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public SalaryStructure() {}

    public SalaryStructure(User employee) {
        this.employee = employee;
    }

    public BigDecimal getGrossSalary() {
        return basicSalary
                .add(hra != null ? hra : BigDecimal.ZERO)
                .add(da != null ? da : BigDecimal.ZERO)
                .add(conveyanceAllowance != null ? conveyanceAllowance : BigDecimal.ZERO)
                .add(medicalAllowance != null ? medicalAllowance : BigDecimal.ZERO)
                .add(otherAllowance != null ? otherAllowance : BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal getTotalDeductions() {
        return (pf != null ? pf : BigDecimal.ZERO)
                .add(esi != null ? esi : BigDecimal.ZERO)
                .add(professionalTax != null ? professionalTax : BigDecimal.ZERO)
                .add(otherDeduction != null ? otherDeduction : BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal getNetSalary() {
        return getGrossSalary().subtract(getTotalDeductions()).setScale(2, RoundingMode.HALF_UP);
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (effectiveFrom == null) effectiveFrom = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getEmployee() { return employee; }
    public void setEmployee(User employee) { this.employee = employee; }

    public BigDecimal getBasicSalary() { return basicSalary; }
    public void setBasicSalary(BigDecimal basicSalary) { this.basicSalary = basicSalary != null ? basicSalary : BigDecimal.ZERO; }

    public BigDecimal getHra() { return hra; }
    public void setHra(BigDecimal hra) { this.hra = hra != null ? hra : BigDecimal.ZERO; }

    public BigDecimal getDa() { return da; }
    public void setDa(BigDecimal da) { this.da = da != null ? da : BigDecimal.ZERO; }

    public BigDecimal getConveyanceAllowance() { return conveyanceAllowance; }
    public void setConveyanceAllowance(BigDecimal conveyanceAllowance) { this.conveyanceAllowance = conveyanceAllowance != null ? conveyanceAllowance : BigDecimal.ZERO; }

    public BigDecimal getMedicalAllowance() { return medicalAllowance; }
    public void setMedicalAllowance(BigDecimal medicalAllowance) { this.medicalAllowance = medicalAllowance != null ? medicalAllowance : BigDecimal.ZERO; }

    public BigDecimal getOtherAllowance() { return otherAllowance; }
    public void setOtherAllowance(BigDecimal otherAllowance) { this.otherAllowance = otherAllowance != null ? otherAllowance : BigDecimal.ZERO; }

    public BigDecimal getPf() { return pf; }
    public void setPf(BigDecimal pf) { this.pf = pf != null ? pf : BigDecimal.ZERO; }

    public BigDecimal getEsi() { return esi; }
    public void setEsi(BigDecimal esi) { this.esi = esi != null ? esi : BigDecimal.ZERO; }

    public BigDecimal getProfessionalTax() { return professionalTax; }
    public void setProfessionalTax(BigDecimal professionalTax) { this.professionalTax = professionalTax != null ? professionalTax : BigDecimal.ZERO; }

    public BigDecimal getOtherDeduction() { return otherDeduction; }
    public void setOtherDeduction(BigDecimal otherDeduction) { this.otherDeduction = otherDeduction != null ? otherDeduction : BigDecimal.ZERO; }

    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
