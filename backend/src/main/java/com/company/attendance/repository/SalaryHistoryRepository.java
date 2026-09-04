package com.company.attendance.repository;

import com.company.attendance.entity.SalaryHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaryHistoryRepository extends JpaRepository<SalaryHistory, Long> {
    List<SalaryHistory> findByEmployeeIdOrderByEffectiveFromDesc(Long employeeId);
    void deleteByEmployeeId(Long employeeId);
}
