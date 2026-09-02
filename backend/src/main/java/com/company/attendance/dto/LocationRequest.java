package com.company.attendance.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

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

    private LocalTime officeLoginTime;
    private LocalTime officeLogoutTime;
    private Integer gracePeriodMinutes;

    // Team Shift Timings
    private LocalTime itLoginTime;
    private LocalTime itLogoutTime;
    private Integer itGraceMinutes;

    private LocalTime edtechLoginTime;
    private LocalTime edtechLogoutTime;
    private Integer edtechGraceMinutes;

    private LocalTime businessLoginTime;
    private LocalTime businessLogoutTime;
    private Integer businessGraceMinutes;

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
}
