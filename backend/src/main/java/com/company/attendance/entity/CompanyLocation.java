package com.company.attendance.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "company_location")
public class CompanyLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "allowed_radius", nullable = false)
    private Double allowedRadius = 50.0;

    @Column(name = "max_gps_accuracy", nullable = false)
    private Double maxGpsAccuracy = 100.0;

    // General default fallback timings
    @Column(name = "office_login_time", nullable = false)
    private LocalTime officeLoginTime = LocalTime.of(9, 0);

    @Column(name = "office_logout_time", nullable = false)
    private LocalTime officeLogoutTime = LocalTime.of(18, 0);

    @Column(name = "grace_period_minutes", nullable = false)
    private Integer gracePeriodMinutes = 15;

    // 1. IT Team Shift (9:00 AM - 6:30 PM)
    @Column(name = "it_login_time", nullable = false)
    private LocalTime itLoginTime = LocalTime.of(9, 0);

    @Column(name = "it_logout_time", nullable = false)
    private LocalTime itLogoutTime = LocalTime.of(18, 30);

    @Column(name = "it_grace_minutes", nullable = false)
    private Integer itGraceMinutes = 15;

    // 2. EdTech Team Shift (8:45 AM - 5:45 PM)
    @Column(name = "edtech_login_time", nullable = false)
    private LocalTime edtechLoginTime = LocalTime.of(8, 45);

    @Column(name = "edtech_logout_time", nullable = false)
    private LocalTime edtechLogoutTime = LocalTime.of(17, 45);

    @Column(name = "edtech_grace_minutes", nullable = false)
    private Integer edtechGraceMinutes = 15;

    // 3. Business Solution Team Shift (8:45 AM - 5:45 PM)
    @Column(name = "business_login_time", nullable = false)
    private LocalTime businessLoginTime = LocalTime.of(8, 45);

    @Column(name = "business_logout_time", nullable = false)
    private LocalTime businessLogoutTime = LocalTime.of(17, 45);

    @Column(name = "business_grace_minutes", nullable = false)
    private Integer businessGraceMinutes = 15;

    // 4. OG Team Shift (8:45 AM - 6:15 PM)
    @Column(name = "og_login_time", nullable = false)
    private LocalTime ogLoginTime = LocalTime.of(8, 45);

    @Column(name = "og_logout_time", nullable = false)
    private LocalTime ogLogoutTime = LocalTime.of(18, 15);

    @Column(name = "og_grace_minutes", nullable = false)
    private Integer ogGraceMinutes = 15;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public CompanyLocation() {}

    public CompanyLocation(String companyName, Double latitude, Double longitude, Double allowedRadius, Double maxGpsAccuracy) {
        this.companyName = companyName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.allowedRadius = allowedRadius;
        this.maxGpsAccuracy = maxGpsAccuracy;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (officeLoginTime == null) officeLoginTime = LocalTime.of(9, 0);
        if (officeLogoutTime == null) officeLogoutTime = LocalTime.of(18, 0);
        if (gracePeriodMinutes == null) gracePeriodMinutes = 15;

        if (itLoginTime == null) itLoginTime = LocalTime.of(9, 0);
        if (itLogoutTime == null) itLogoutTime = LocalTime.of(18, 30);
        if (itGraceMinutes == null) itGraceMinutes = 15;

        if (edtechLoginTime == null) edtechLoginTime = LocalTime.of(8, 45);
        if (edtechLogoutTime == null) edtechLogoutTime = LocalTime.of(17, 45);
        if (edtechGraceMinutes == null) edtechGraceMinutes = 15;

        if (businessLoginTime == null) businessLoginTime = LocalTime.of(8, 45);
        if (businessLogoutTime == null) businessLogoutTime = LocalTime.of(17, 45);
        if (businessGraceMinutes == null) businessGraceMinutes = 15;

        if (ogLoginTime == null) ogLoginTime = LocalTime.of(8, 45);
        if (ogLogoutTime == null) ogLogoutTime = LocalTime.of(18, 15);
        if (ogGraceMinutes == null) ogGraceMinutes = 15;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getAllowedRadius() { return allowedRadius; }
    public void setAllowedRadius(Double allowedRadius) { this.allowedRadius = allowedRadius; }

    public Double getMaxGpsAccuracy() { return maxGpsAccuracy; }
    public void setMaxGpsAccuracy(Double maxGpsAccuracy) { this.maxGpsAccuracy = maxGpsAccuracy; }

    public LocalTime getOfficeLoginTime() { return officeLoginTime; }
    public void setOfficeLoginTime(LocalTime officeLoginTime) { this.officeLoginTime = officeLoginTime; }

    public LocalTime getOfficeLogoutTime() { return officeLogoutTime; }
    public void setOfficeLogoutTime(LocalTime officeLogoutTime) { this.officeLogoutTime = officeLogoutTime; }

    public Integer getGracePeriodMinutes() { return gracePeriodMinutes; }
    public void setGracePeriodMinutes(Integer gracePeriodMinutes) { this.gracePeriodMinutes = gracePeriodMinutes; }

    public LocalTime getItLoginTime() { return itLoginTime; }
    public void setItLoginTime(LocalTime itLoginTime) { this.itLoginTime = itLoginTime; }

    public LocalTime getItLogoutTime() { return itLogoutTime; }
    public void setItLogoutTime(LocalTime itLogoutTime) { this.itLogoutTime = itLogoutTime; }

    public Integer getItGraceMinutes() { return itGraceMinutes; }
    public void setItGraceMinutes(Integer itGraceMinutes) { this.itGraceMinutes = itGraceMinutes; }

    public LocalTime getEdtechLoginTime() { return edtechLoginTime; }
    public void setEdtechLoginTime(LocalTime edtechLoginTime) { this.edtechLoginTime = edtechLoginTime; }

    public LocalTime getEdtechLogoutTime() { return edtechLogoutTime; }
    public void setEdtechLogoutTime(LocalTime edtechLogoutTime) { this.edtechLogoutTime = edtechLogoutTime; }

    public Integer getEdtechGraceMinutes() { return edtechGraceMinutes; }
    public void setEdtechGraceMinutes(Integer edtechGraceMinutes) { this.edtechGraceMinutes = edtechGraceMinutes; }

    public LocalTime getBusinessLoginTime() { return businessLoginTime; }
    public void setBusinessLoginTime(LocalTime businessLoginTime) { this.businessLoginTime = businessLoginTime; }

    public LocalTime getBusinessLogoutTime() { return businessLogoutTime; }
    public void setBusinessLogoutTime(LocalTime businessLogoutTime) { this.businessLogoutTime = businessLogoutTime; }

    public Integer getBusinessGraceMinutes() { return businessGraceMinutes; }
    public void setBusinessGraceMinutes(Integer businessGraceMinutes) { this.businessGraceMinutes = businessGraceMinutes; }

    public LocalTime getOgLoginTime() { return ogLoginTime; }
    public void setOgLoginTime(LocalTime ogLoginTime) { this.ogLoginTime = ogLoginTime; }

    public LocalTime getOgLogoutTime() { return ogLogoutTime; }
    public void setOgLogoutTime(LocalTime ogLogoutTime) { this.ogLogoutTime = ogLogoutTime; }

    public Integer getOgGraceMinutes() { return ogGraceMinutes; }
    public void setOgGraceMinutes(Integer ogGraceMinutes) { this.ogGraceMinutes = ogGraceMinutes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
