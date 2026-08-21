package com.company.attendance.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_balances", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "year"})
})
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(nullable = false)
    private int year;

    @Column(name = "casual_leave_granted", nullable = false)
    private double casualLeaveGranted = 5.0;

    @Column(name = "sick_leave_granted", nullable = false)
    private double sickLeaveGranted = 1.0;

    @Column(name = "comp_off_granted", nullable = false)
    private double compOffGranted = 0.0;

    @Column(name = "loss_of_pay_granted", nullable = false)
    private double lossOfPayGranted = 0.0;

    @Column(name = "wfh_granted", nullable = false)
    private double workFromHomeGranted = 0.0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public LeaveBalance() {}

    public LeaveBalance(User employee, int year) {
        this.employee = employee;
        this.year = year;
        this.casualLeaveGranted = 5.0;
        this.sickLeaveGranted = 1.0;
        this.compOffGranted = 0.0;
        this.lossOfPayGranted = 0.0;
        this.workFromHomeGranted = 0.0;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
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

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public double getCasualLeaveGranted() { return casualLeaveGranted; }
    public void setCasualLeaveGranted(double casualLeaveGranted) { this.casualLeaveGranted = casualLeaveGranted; }

    public double getSickLeaveGranted() { return sickLeaveGranted; }
    public void setSickLeaveGranted(double sickLeaveGranted) { this.sickLeaveGranted = sickLeaveGranted; }

    public double getCompOffGranted() { return compOffGranted; }
    public void setCompOffGranted(double compOffGranted) { this.compOffGranted = compOffGranted; }

    public double getLossOfPayGranted() { return lossOfPayGranted; }
    public void setLossOfPayGranted(double lossOfPayGranted) { this.lossOfPayGranted = lossOfPayGranted; }

    public double getWorkFromHomeGranted() { return workFromHomeGranted; }
    public void setWorkFromHomeGranted(double workFromHomeGranted) { this.workFromHomeGranted = workFromHomeGranted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
