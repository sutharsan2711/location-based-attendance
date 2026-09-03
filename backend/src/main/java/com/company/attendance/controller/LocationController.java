package com.company.attendance.controller;

import com.company.attendance.dto.LocationRequest;
import com.company.attendance.entity.CompanyLocation;
import com.company.attendance.service.LocationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/location")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    public ResponseEntity<CompanyLocation> getCompanyLocation() {
        return ResponseEntity.ok(locationService.getCompanyLocation());
    }

    @GetMapping("/all")
    public ResponseEntity<List<CompanyLocation>> getAllLocations() {
        return ResponseEntity.ok(locationService.getAllLocations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyLocation> getLocationById(@PathVariable Long id) {
        return ResponseEntity.ok(locationService.getLocationById(id));
    }

    @PostMapping
    public ResponseEntity<CompanyLocation> createLocation(@Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.createLocation(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyLocation> updateLocationById(@PathVariable Long id, @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.updateLocationById(id, request));
    }

    @PutMapping
    public ResponseEntity<CompanyLocation> updateCompanyLocation(@Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.updateCompanyLocation(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteLocation(@PathVariable Long id) {
        locationService.deleteLocation(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Location deleted successfully"));
    }
}
