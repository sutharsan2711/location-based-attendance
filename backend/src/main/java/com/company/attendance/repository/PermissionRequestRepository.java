package com.company.attendance.repository;

import com.company.attendance.entity.PermissionRequest;
import com.company.attendance.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PermissionRequestRepository extends JpaRepository<PermissionRequest, Long> {

    List<PermissionRequest> findByEmployeeIdOrderByPermissionDateDesc(Long employeeId);

    List<PermissionRequest> findByEmployeeIdAndPermissionDateAndStatus(Long employeeId, LocalDate permissionDate, RequestStatus status);

    long countByStatus(RequestStatus status);

    @Query("SELECT p FROM PermissionRequest p JOIN FETCH p.employee e WHERE " +
           "(:employeeId IS NULL OR e.id = :employeeId) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:startDate IS NULL OR p.permissionDate >= :startDate) AND " +
           "(:endDate IS NULL OR p.permissionDate <= :endDate) " +
           "ORDER BY p.permissionDate DESC, p.createdAt DESC")
    List<PermissionRequest> findByFilters(
            @Param("employeeId") Long employeeId,
            @Param("status") RequestStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
