package com.company.attendance.repository;

import com.company.attendance.entity.Payroll;
import com.company.attendance.enums.PayrollStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    Optional<Payroll> findByEmployeeIdAndMonthAndYear(Long employeeId, Integer month, Integer year);

    boolean existsByEmployeeIdAndMonthAndYear(Long employeeId, Integer month, Integer year);

    List<Payroll> findByMonthAndYear(Integer month, Integer year);

    List<Payroll> findByEmployeeIdOrderByYearDescMonthDesc(Long employeeId);

    List<Payroll> findByEmployeeIdAndYearOrderByMonthDesc(Long employeeId, Integer year);

    @Query("SELECT p FROM Payroll p WHERE " +
           "(:month IS NULL OR p.month = :month) AND " +
           "(:year IS NULL OR p.year = :year) AND " +
           "(:employeeId IS NULL OR p.employee.id = :employeeId) AND " +
           "(:status IS NULL OR p.status = :status) " +
           "ORDER BY p.year DESC, p.month DESC, p.employee.name ASC")
    List<Payroll> findWithFilters(
            @Param("month") Integer month,
            @Param("year") Integer year,
            @Param("employeeId") Long employeeId,
            @Param("status") PayrollStatus status
    );

    long countByMonthAndYear(Integer month, Integer year);

    long countByMonthAndYearAndStatus(Integer month, Integer year, PayrollStatus status);

    void deleteByEmployeeId(Long employeeId);
}
