package com.company.attendance.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "holidays", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"holiday_date", "name"})
})
public class Holiday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "holiday_date", nullable = false)
    private LocalDate holidayDate;

    @Column(name = "day_of_week", length = 30)
    private String dayOfWeek;

    @Column(name = "holiday_type", nullable = false, length = 50)
    private String holidayType; // National Holiday, Public Holiday, Festival Holiday, Company Holiday, Restricted Holiday

    @Column(length = 500)
    private String description;

    @Column(name = "is_optional", nullable = false)
    private Boolean isOptional = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Holiday() {}

    public Holiday(String name, LocalDate holidayDate, String holidayType, String description, Boolean isOptional) {
        this.name = name;
        this.holidayDate = holidayDate;
        this.holidayType = holidayType;
        this.description = description;
        this.isOptional = isOptional != null ? isOptional : false;
        if (holidayDate != null) {
            this.dayOfWeek = capitalize(holidayDate.getDayOfWeek().name().toLowerCase());
        }
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (holidayDate != null && (dayOfWeek == null || dayOfWeek.trim().isEmpty())) {
            this.dayOfWeek = capitalize(holidayDate.getDayOfWeek().name().toLowerCase());
        }
        if (isOptional == null) {
            isOptional = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (holidayDate != null) {
            this.dayOfWeek = capitalize(holidayDate.getDayOfWeek().name().toLowerCase());
        }
    }

    private String capitalize(String text) {
        if (text == null || text.isEmpty()) return text;
        return text.substring(0, 1).toUpperCase() + text.substring(1);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getHolidayDate() {
        return holidayDate;
    }

    public void setHolidayDate(LocalDate holidayDate) {
        this.holidayDate = holidayDate;
        if (holidayDate != null) {
            this.dayOfWeek = capitalize(holidayDate.getDayOfWeek().name().toLowerCase());
        }
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public String getHolidayType() {
        return holidayType;
    }

    public void setHolidayType(String holidayType) {
        this.holidayType = holidayType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsOptional() {
        return isOptional;
    }

    public void setIsOptional(Boolean isOptional) {
        this.isOptional = isOptional != null ? isOptional : false;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
