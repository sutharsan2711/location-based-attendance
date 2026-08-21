package com.company.attendance.service;

import com.company.attendance.dto.PermissionCreateRequest;
import com.company.attendance.dto.RequestStatusUpdateRequest;
import com.company.attendance.entity.PermissionRequest;
import com.company.attendance.entity.User;
import com.company.attendance.enums.RequestStatus;
import com.company.attendance.enums.UserStatus;
import com.company.attendance.exception.ResourceNotFoundException;
import com.company.attendance.repository.PermissionRequestRepository;
import com.company.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PermissionService {

    private final PermissionRequestRepository permissionRepository;
    private final UserRepository userRepository;

    public PermissionService(PermissionRequestRepository permissionRepository, UserRepository userRepository) {
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PermissionRequest applyPermission(String email, PermissionCreateRequest request) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));

        if (employee.getStatus() == UserStatus.INACTIVE) {
            throw new IllegalStateException("Your employee account is inactive.");
        }

        if (request.getToTime().isBefore(request.getFromTime())) {
            throw new IllegalArgumentException("To Time must be after From Time.");
        }

        PermissionRequest permission = new PermissionRequest(
                employee,
                request.getPermissionDate(),
                request.getFromTime(),
                request.getToTime(),
                request.getReason().trim(),
                request.getRemarks() != null ? request.getRemarks().trim() : null
        );

        return permissionRepository.save(permission);
    }

    public List<PermissionRequest> getMyPermissions(String email) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));
        return permissionRepository.findByEmployeeIdOrderByPermissionDateDesc(employee.getId());
    }

    public List<PermissionRequest> getAllPermissions(Long employeeId, RequestStatus status, LocalDate startDate, LocalDate endDate) {
        return permissionRepository.findByFilters(employeeId, status, startDate, endDate);
    }

    @Transactional
    public PermissionRequest updatePermissionStatus(Long id, RequestStatusUpdateRequest request) {
        PermissionRequest permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission request not found with ID: " + id));

        permission.setStatus(request.getStatus());
        if (request.getAdminRemarks() != null) {
            permission.setAdminRemarks(request.getAdminRemarks().trim());
        }

        return permissionRepository.save(permission);
    }
}
