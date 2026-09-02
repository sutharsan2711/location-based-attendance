package com.company.attendance.repository;

import com.company.attendance.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    Optional<LeaveBalance> findByEmployeeIdAndYear(Long employeeId, int year);

    List<LeaveBalance> findByYear(int year);

    @Query("SELECT b FROM LeaveBalance b JOIN FETCH b.employee WHERE b.year = :year")
    List<LeaveBalance> findAllWithEmployeeByYear(int year);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM LeaveBalance b WHERE b.employee.id = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
}
