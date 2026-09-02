package com.company.attendance.repository;

import com.company.attendance.entity.LeaveRequest;
import com.company.attendance.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeIdOrderByFromDateDesc(Long employeeId);

    @Query("SELECT l FROM LeaveRequest l WHERE l.employee.id = :employeeId AND l.status = :status AND :date BETWEEN l.fromDate AND l.toDate")
    List<LeaveRequest> findActiveLeaveForEmployeeOnDate(
            @Param("employeeId") Long employeeId,
            @Param("date") LocalDate date,
            @Param("status") RequestStatus status);

    @Query("SELECT l FROM LeaveRequest l WHERE l.status = :status AND :date BETWEEN l.fromDate AND l.toDate")
    List<LeaveRequest> findApprovedLeavesForDate(
            @Param("date") LocalDate date,
            @Param("status") RequestStatus status);

    @Query("SELECT l FROM LeaveRequest l WHERE l.status = :status AND ((l.fromDate BETWEEN :startDate AND :endDate) OR (l.toDate BETWEEN :startDate AND :endDate) OR (l.fromDate <= :startDate AND l.toDate >= :endDate))")
    List<LeaveRequest> findApprovedLeavesInDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") RequestStatus status);

    long countByStatus(RequestStatus status);

    @Query("SELECT l FROM LeaveRequest l JOIN FETCH l.employee e WHERE " +
           "(:employeeId IS NULL OR e.id = :employeeId) AND " +
           "(:status IS NULL OR l.status = :status) AND " +
           "(:startDate IS NULL OR l.toDate >= :startDate) AND " +
           "(:endDate IS NULL OR l.fromDate <= :endDate) " +
           "ORDER BY CASE WHEN l.status = 'PENDING' THEN 0 ELSE 1 END, l.createdAt DESC, l.id DESC")
    List<LeaveRequest> findByFilters(
            @Param("employeeId") Long employeeId,
            @Param("status") RequestStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM LeaveRequest l WHERE l.employee.id = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
}
