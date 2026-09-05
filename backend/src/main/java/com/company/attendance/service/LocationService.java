package com.company.attendance.service;

import com.company.attendance.dto.LocationRequest;
import com.company.attendance.entity.CompanyLocation;
import com.company.attendance.exception.ResourceNotFoundException;
import com.company.attendance.repository.CompanyLocationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;

@Service
public class LocationService {

    private final CompanyLocationRepository locationRepository;

    public LocationService(CompanyLocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public List<CompanyLocation> getAllLocations() {
        List<CompanyLocation> locations = locationRepository.findAll();
        if (locations.isEmpty()) {
            locations.add(getCompanyLocation());
        }
        return locations;
    }

    public CompanyLocation getLocationById(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company location not found with id: " + id));
    }

    public CompanyLocation createLocation(LocationRequest request) {
        CompanyLocation location = new CompanyLocation();
        populateLocationFromRequest(location, request);
        return locationRepository.save(location);
    }

    public CompanyLocation updateLocationById(Long id, LocationRequest request) {
        CompanyLocation location = getLocationById(id);
        populateLocationFromRequest(location, request);
        return locationRepository.save(location);
    }

    public void deleteLocation(Long id) {
        List<CompanyLocation> all = locationRepository.findAll();
        if (all.size() <= 1) {
            throw new IllegalStateException("Cannot delete the only company location. At least one location must exist.");
        }
        CompanyLocation location = getLocationById(id);
        locationRepository.delete(location);
    }

    public CompanyLocation getCompanyLocation() {
        return locationRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> {
                    // Fallback default coordinates if database seed is missing
                    CompanyLocation defaultLoc = new CompanyLocation("ABC Technologies - Main Office", 11.078319, 76.999745, 50.0, 100.0);
                    defaultLoc.setItLoginTime(LocalTime.of(9, 0));
                    defaultLoc.setItLogoutTime(LocalTime.of(18, 30));
                    defaultLoc.setItGraceMinutes(15);
                    defaultLoc.setEdtechLoginTime(LocalTime.of(8, 45));
                    defaultLoc.setEdtechLogoutTime(LocalTime.of(17, 45));
                    defaultLoc.setEdtechGraceMinutes(15);
                    defaultLoc.setBusinessLoginTime(LocalTime.of(8, 45));
                    defaultLoc.setBusinessLogoutTime(LocalTime.of(17, 45));
                    defaultLoc.setBusinessGraceMinutes(15);
                    defaultLoc.setOgLoginTime(LocalTime.of(8, 45));
                    defaultLoc.setOgLogoutTime(LocalTime.of(18, 15));
                    defaultLoc.setOgGraceMinutes(15);
                    return locationRepository.save(defaultLoc);
                });
    }

    public CompanyLocation updateCompanyLocation(LocationRequest request) {
        CompanyLocation location = locationRepository.findFirstByOrderByIdAsc()
                .orElse(new CompanyLocation());
        populateLocationFromRequest(location, request);
        return locationRepository.save(location);
    }

    private void populateLocationFromRequest(CompanyLocation location, LocationRequest request) {
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

        // IT Team
        if (request.getItLoginTime() != null) {
            location.setItLoginTime(request.getItLoginTime());
        }
        if (request.getItLogoutTime() != null) {
            location.setItLogoutTime(request.getItLogoutTime());
        }
        if (request.getItGraceMinutes() != null) {
            location.setItGraceMinutes(request.getItGraceMinutes());
        }

        // EdTech Team
        if (request.getEdtechLoginTime() != null) {
            location.setEdtechLoginTime(request.getEdtechLoginTime());
        }
        if (request.getEdtechLogoutTime() != null) {
            location.setEdtechLogoutTime(request.getEdtechLogoutTime());
        }
        if (request.getEdtechGraceMinutes() != null) {
            location.setEdtechGraceMinutes(request.getEdtechGraceMinutes());
        }

        // Business Solution Team
        if (request.getBusinessLoginTime() != null) {
            location.setBusinessLoginTime(request.getBusinessLoginTime());
        }
        if (request.getBusinessLogoutTime() != null) {
            location.setBusinessLogoutTime(request.getBusinessLogoutTime());
        }
        if (request.getBusinessGraceMinutes() != null) {
            location.setBusinessGraceMinutes(request.getBusinessGraceMinutes());
        }

        // OG Team
        if (request.getOgLoginTime() != null) {
            location.setOgLoginTime(request.getOgLoginTime());
        }
        if (request.getOgLogoutTime() != null) {
            location.setOgLogoutTime(request.getOgLogoutTime());
        }
        if (request.getOgGraceMinutes() != null) {
            location.setOgGraceMinutes(request.getOgGraceMinutes());
        }
    }
}
