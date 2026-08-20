package com.company.attendance.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
