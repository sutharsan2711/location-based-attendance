package com.company.attendance.repository;

import com.company.attendance.entity.SalaryStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> {
    Optional<SalaryStructure> findByEmployeeId(Long employeeId);
    boolean existsByEmployeeId(Long employeeId);
    void deleteByEmployeeId(Long employeeId);
}
