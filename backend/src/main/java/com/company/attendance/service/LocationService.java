package com.company.attendance.service;

import com.company.attendance.dto.LocationRequest;
import com.company.attendance.entity.CompanyLocation;
import com.company.attendance.repository.CompanyLocationRepository;
import org.springframework.stereotype.Service;

@Service
public class LocationService {

    private final CompanyLocationRepository locationRepository;

    public LocationService(CompanyLocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public CompanyLocation getCompanyLocation() {
        return locationRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> {
                    // Fallback default coordinates (from user prompt) if database seed is missing
                    CompanyLocation defaultLoc = new CompanyLocation("ABC Technologies", 11.123456, 78.123456, 50.0, 100.0);
                    return locationRepository.save(defaultLoc);
                });
    }

    public CompanyLocation updateCompanyLocation(LocationRequest request) {
        CompanyLocation location = locationRepository.findFirstByOrderByIdAsc()
                .orElse(new CompanyLocation());

        location.setCompanyName(request.getCompanyName().trim());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setAllowedRadius(request.getAllowedRadius());
        location.setMaxGpsAccuracy(request.getMaxGpsAccuracy());

        if (request.getOfficeLoginTime() != null) {
            location.setOfficeLoginTime(request.getOfficeLoginTime());
        }
        if (request.getOfficeLogoutTime() != null) {
            location.setOfficeLogoutTime(request.getOfficeLogoutTime());
        }
        if (request.getGracePeriodMinutes() != null) {
            location.setGracePeriodMinutes(request.getGracePeriodMinutes());
        }

        return locationRepository.save(location);
    }
}
