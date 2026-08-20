package com.company.attendance.controller;

import com.company.attendance.dto.LocationRequest;
import com.company.attendance.entity.CompanyLocation;
import com.company.attendance.service.LocationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PutMapping
    public ResponseEntity<CompanyLocation> updateCompanyLocation(@Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.updateCompanyLocation(request));
    }
}
