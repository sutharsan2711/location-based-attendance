package com.company.attendance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_history")
public class SalaryHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal basicSalary;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal grossSalary;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalDeduction;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal netSalary;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public SalaryHistory() {}

    public SalaryHistory(User employee, BigDecimal basicSalary, BigDecimal grossSalary, BigDecimal totalDeduction, BigDecimal netSalary, LocalDate effectiveFrom) {
        this.employee = employee;
        this.basicSalary = basicSalary;
        this.grossSalary = grossSalary;
        this.totalDeduction = totalDeduction;
        this.netSalary = netSalary;
        this.effectiveFrom = effectiveFrom != null ? effectiveFrom : LocalDate.now();
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (effectiveFrom == null) effectiveFrom = LocalDate.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getEmployee() { return employee; }
    public void setEmployee(User employee) { this.employee = employee; }

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
