package com.company.attendance.service;

import com.company.attendance.dto.EmployeeRequest;
import com.company.attendance.entity.User;
import com.company.attendance.enums.UserStatus;
import com.company.attendance.exception.ResourceNotFoundException;
import com.company.attendance.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class EmployeeService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllEmployees() {
        return userRepository.findAll();
    }

    public User getEmployeeById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    public User createEmployee(EmployeeRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }
        if (userRepository.existsByEmployeeCode(request.getEmployeeCode())) {
            throw new IllegalArgumentException("Employee Code already exists: " + request.getEmployeeCode());
        }
        if (!StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("Password is required for new employees");
        }

        User user = new User();
        user.setEmployeeCode(request.getEmployeeCode().trim());
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setRole(request.getRole());
        user.setStatus(request.getStatus());
        if (request.getProfileData() != null) {
            user.setProfileData(request.getProfileData());
        }

        return userRepository.save(user);
    }

    public User updateEmployee(Long id, EmployeeRequest request) {
        User user = getEmployeeById(id);

        // Validate unique email (if modified)
        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        // Validate unique employee code (if modified)
        if (!user.getEmployeeCode().equalsIgnoreCase(request.getEmployeeCode()) && userRepository.existsByEmployeeCode(request.getEmployeeCode())) {
            throw new IllegalArgumentException("Employee Code already exists: " + request.getEmployeeCode());
        }

        user.setEmployeeCode(request.getEmployeeCode().trim());
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim());
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setRole(request.getRole());
        user.setStatus(request.getStatus());

        if (request.getProfileData() != null) {
            user.setProfileData(request.getProfileData());
        }

        // Update password if provided in request
        if (StringUtils.hasText(request.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return userRepository.save(user);
    }

    public void deleteEmployee(Long id) {
        User user = getEmployeeById(id);
        userRepository.delete(user);
    }

    public User toggleEmployeeStatus(Long id, UserStatus status) {
        User user = getEmployeeById(id);
        user.setStatus(status);
        return userRepository.save(user);
    }

    public void resetPassword(Long id, String newPassword) {
        if (!StringUtils.hasText(newPassword)) {
            throw new IllegalArgumentException("Password cannot be empty");
        }
        User user = getEmployeeById(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
