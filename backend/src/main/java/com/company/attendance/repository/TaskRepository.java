package com.company.attendance.repository;

import com.company.attendance.entity.Task;
import com.company.attendance.entity.User;
import com.company.attendance.enums.TaskPriority;
import com.company.attendance.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByAssignedEmployeeOrderByCreatedAtDesc(User employee);

    List<Task> findByAssignedEmployeeAndStatusOrderByCreatedAtDesc(User employee, TaskStatus status);

    List<Task> findAllByOrderByCreatedAtDesc();

    List<Task> findByDepartmentOrderByCreatedAtDesc(String department);

    @Query("SELECT t FROM Task t WHERE " +
           "(:employeeId IS NULL OR t.assignedEmployee.id = :employeeId) AND " +
           "(:department IS NULL OR t.department = :department) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) " +
           "ORDER BY t.createdAt DESC")
    List<Task> findByFilters(@Param("employeeId") Long employeeId,
                             @Param("department") String department,
                             @Param("status") TaskStatus status,
                             @Param("priority") TaskPriority priority);

    long countByStatus(TaskStatus status);

    long countByAssignedEmployeeAndStatus(User employee, TaskStatus status);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.dueDate < :today AND t.status NOT IN ('COMPLETED', 'CANCELLED')")
    long countOverdueTasks(@Param("today") LocalDate today);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignedEmployee = :employee AND t.dueDate < :today AND t.status NOT IN ('COMPLETED', 'CANCELLED')")
    long countEmployeeOverdueTasks(@Param("employee") User employee, @Param("today") LocalDate today);
}
