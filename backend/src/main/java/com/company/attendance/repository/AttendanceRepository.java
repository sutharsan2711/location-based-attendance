package com.company.attendance.repository;

import com.company.attendance.entity.Attendance;
import com.company.attendance.enums.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    
    Optional<Attendance> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);
    
    List<Attendance> findByEmployeeIdOrderByAttendanceDateDesc(Long employeeId);
    
    List<Attendance> findByAttendanceDate(LocalDate date);
    
    List<Attendance> findByAttendanceDateBetweenOrderByAttendanceDateDesc(LocalDate startDate, LocalDate endDate);
    
    long countByAttendanceDateAndStatus(LocalDate date, AttendanceStatus status);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.attendanceDate = :date AND a.status IN (:statuses)")
    long countByAttendanceDateAndStatusIn(@Param("date") LocalDate date, @Param("statuses") List<AttendanceStatus> statuses);

    @Query("SELECT a FROM Attendance a JOIN FETCH a.employee e WHERE " +
           "(:employeeId IS NULL OR e.id = :employeeId) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:startDate IS NULL OR a.attendanceDate >= :startDate) AND " +
           "(:endDate IS NULL OR a.attendanceDate <= :endDate) " +
           "ORDER BY a.attendanceDate DESC, a.loginTime DESC")
    List<Attendance> findByFilters(
            @Param("employeeId") Long employeeId,
            @Param("status") AttendanceStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Attendance a WHERE a.employee.id = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
}
