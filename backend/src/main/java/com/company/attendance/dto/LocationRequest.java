package com.company.attendance.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class LocationRequest {

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;

    @NotNull(message = "Allowed radius is required")
    @DecimalMin(value = "1.0", message = "Radius must be at least 1 meter")
    private Double allowedRadius;

    @NotNull(message = "Max GPS accuracy is required")
    @DecimalMin(value = "1.0", message = "Max GPS accuracy must be at least 1 meter")
    private Double maxGpsAccuracy;

    // Getters and Setters
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
}
