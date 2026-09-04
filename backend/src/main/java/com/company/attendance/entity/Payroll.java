package com.company.attendance.entity;

import com.company.attendance.enums.PayrollStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "payroll",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_payroll_employee_month_year", columnNames = {"employee_id", "payroll_month", "payroll_year"})
    }
)
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(name = "payroll_month", nullable = false)
    private Integer month; // 1 - 12

    @Column(name = "payroll_year", nullable = false)
    private Integer year;

    // ── Fixed Earnings Snapshot ──
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

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal grossSalary = BigDecimal.ZERO;

    // ── Fixed Deductions Snapshot ──
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pf = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal esi = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal professionalTax = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal otherDeduction = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalDeduction = BigDecimal.ZERO;

    // ── Net Pay ──
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal netSalary = BigDecimal.ZERO;

    // ── Attendance Metrics Snapshot ──
    @Column(name = "working_days", nullable = false)
    private Integer workingDays = 0;

    @Column(name = "present_days", nullable = false)
    private Integer presentDays = 0;

    @Column(name = "absent_days", nullable = false)
    private Integer absentDays = 0;

    @Column(name = "leave_days", nullable = false)
    private Integer leaveDays = 0;

    @Column(name = "permission_days", nullable = false)
    private Integer permissionDays = 0;

    @Column(name = "late_days", nullable = false)
    private Integer lateDays = 0;

    // ── Status & Timestamps ──
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PayrollStatus status = PayrollStatus.GENERATED;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt = LocalDateTime.now();

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Payroll() {}

    public void recalculateTotals() {
        this.grossSalary = basicSalary
                .add(hra != null ? hra : BigDecimal.ZERO)
                .add(da != null ? da : BigDecimal.ZERO)
                .add(conveyanceAllowance != null ? conveyanceAllowance : BigDecimal.ZERO)
                .add(medicalAllowance != null ? medicalAllowance : BigDecimal.ZERO)
                .add(otherAllowance != null ? otherAllowance : BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        this.totalDeduction = (pf != null ? pf : BigDecimal.ZERO)
                .add(esi != null ? esi : BigDecimal.ZERO)
                .add(professionalTax != null ? professionalTax : BigDecimal.ZERO)
                .add(otherDeduction != null ? otherDeduction : BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        this.netSalary = this.grossSalary.subtract(this.totalDeduction).setScale(2, RoundingMode.HALF_UP);
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (generatedAt == null) generatedAt = LocalDateTime.now();
        recalculateTotals();
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
