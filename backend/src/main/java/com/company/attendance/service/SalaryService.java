package com.company.attendance.service;

import com.company.attendance.dto.SalaryHistoryResponse;
import com.company.attendance.dto.SalaryStructureRequest;
import com.company.attendance.dto.SalaryStructureResponse;
import com.company.attendance.entity.SalaryHistory;
import com.company.attendance.entity.SalaryStructure;
import com.company.attendance.entity.User;
import com.company.attendance.enums.Role;
import com.company.attendance.exception.ResourceNotFoundException;
import com.company.attendance.repository.SalaryHistoryRepository;
import com.company.attendance.repository.SalaryStructureRepository;
import com.company.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SalaryService {

    private final SalaryStructureRepository salaryStructureRepository;
    private final SalaryHistoryRepository salaryHistoryRepository;
    private final UserRepository userRepository;

    public SalaryService(
            SalaryStructureRepository salaryStructureRepository,
            SalaryHistoryRepository salaryHistoryRepository,
            UserRepository userRepository
    ) {
        this.salaryStructureRepository = salaryStructureRepository;
        this.salaryHistoryRepository = salaryHistoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<SalaryStructureResponse> getAllSalaryStructures() {
        // Fetch all active non-admin employees and map their structure
        List<User> employees = userRepository.findByRoleNot(Role.ADMIN);
        return employees.stream().map(emp -> {
            SalaryStructure structure = salaryStructureRepository.findByEmployeeId(emp.getId())
                    .orElseGet(() -> {
                        SalaryStructure s = new SalaryStructure(emp);
                        return s;
                    });
            return SalaryStructureResponse.fromEntity(structure);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SalaryStructureResponse getSalaryStructureByEmployeeId(Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + employeeId));

        SalaryStructure structure = salaryStructureRepository.findByEmployeeId(employeeId)
                .orElseGet(() -> new SalaryStructure(employee));

        return SalaryStructureResponse.fromEntity(structure);
    }

    @Transactional
    public SalaryStructureResponse saveOrUpdateSalaryStructure(SalaryStructureRequest req) {
        User employee = userRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + req.getEmployeeId()));

        SalaryStructure structure = salaryStructureRepository.findByEmployeeId(req.getEmployeeId())
                .orElseGet(() -> new SalaryStructure(employee));

        // Update structure fields
        structure.setBasicSalary(req.getBasicSalary());
        structure.setHra(req.getHra());
        structure.setDa(req.getDa());
        structure.setConveyanceAllowance(req.getConveyanceAllowance());
        structure.setMedicalAllowance(req.getMedicalAllowance());
        structure.setOtherAllowance(req.getOtherAllowance());

        structure.setPf(req.getPf());
        structure.setEsi(req.getEsi());
        structure.setProfessionalTax(req.getProfessionalTax());
        structure.setOtherDeduction(req.getOtherDeduction());

        if (req.getEffectiveFrom() != null) {
            structure.setEffectiveFrom(req.getEffectiveFrom());
        }

        SalaryStructure saved = salaryStructureRepository.save(structure);

        // Record Salary History Revision
        SalaryHistory history = new SalaryHistory(
                employee,
                saved.getBasicSalary(),
                saved.getGrossSalary(),
                saved.getTotalDeductions(),
                saved.getNetSalary(),
                saved.getEffectiveFrom() != null ? saved.getEffectiveFrom() : LocalDate.now()
        );
        salaryHistoryRepository.save(history);

        return SalaryStructureResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<SalaryHistoryResponse> getSalaryHistory(Long employeeId) {
        if (!userRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with ID: " + employeeId);
        }
        return salaryHistoryRepository.findByEmployeeIdOrderByEffectiveFromDesc(employeeId)
                .stream()
                .map(SalaryHistoryResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
