package com.company.attendance.dto;

import com.company.attendance.entity.Task;
import com.company.attendance.enums.TaskPriority;
import com.company.attendance.enums.TaskStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String employeeEmail;

    // Aliases for Frontend consistency
    private Long assignedEmployeeId;
    private String assignedEmployeeCode;
    private String assignedEmployeeName;
    private String assignedEmployeeEmail;

    private String department;
    private Long assignedById;
    private String assignedByName;
    private Long createdById;
    private String createdByName;

    private TaskPriority priority;
    private TaskStatus status;
    private LocalDate startDate;
    private LocalDate dueDate;
    private String completionNotes;
    private String checklistJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TaskResponse() {}

    public static TaskResponse fromEntity(Task task) {
        TaskResponse dto = new TaskResponse();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        if (task.getAssignedEmployee() != null) {
            Long empId = task.getAssignedEmployee().getId();
            String empCode = task.getAssignedEmployee().getEmployeeCode();
            String empName = task.getAssignedEmployee().getName();
            String empEmail = task.getAssignedEmployee().getEmail();

            dto.setEmployeeId(empId);
            dto.setEmployeeCode(empCode);
            dto.setEmployeeName(empName);
            dto.setEmployeeEmail(empEmail);

            dto.setAssignedEmployeeId(empId);
            dto.setAssignedEmployeeCode(empCode);
            dto.setAssignedEmployeeName(empName);
            dto.setAssignedEmployeeEmail(empEmail);
        }
        if (task.getAssignedBy() != null) {
            Long creatorId = task.getAssignedBy().getId();
            String creatorName = task.getAssignedBy().getName();

            dto.setAssignedById(creatorId);
            dto.setAssignedByName(creatorName);
            dto.setCreatedById(creatorId);
            dto.setCreatedByName(creatorName);
        }
        dto.setDepartment(task.getDepartment());
        dto.setPriority(task.getPriority());
        dto.setStatus(task.getStatus());
        dto.setStartDate(task.getStartDate());
        dto.setDueDate(task.getDueDate());
        dto.setCompletionNotes(task.getCompletionNotes());
        dto.setChecklistJson(task.getChecklistJson());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeEmail() { return employeeEmail; }
    public void setEmployeeEmail(String employeeEmail) { this.employeeEmail = employeeEmail; }

    public Long getAssignedEmployeeId() { return assignedEmployeeId != null ? assignedEmployeeId : employeeId; }
    public void setAssignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; }

    public String getAssignedEmployeeCode() { return assignedEmployeeCode != null ? assignedEmployeeCode : employeeCode; }
    public void setAssignedEmployeeCode(String assignedEmployeeCode) { this.assignedEmployeeCode = assignedEmployeeCode; }

    public String getAssignedEmployeeName() { return assignedEmployeeName != null ? assignedEmployeeName : employeeName; }
    public void setAssignedEmployeeName(String assignedEmployeeName) { this.assignedEmployeeName = assignedEmployeeName; }

    public String getAssignedEmployeeEmail() { return assignedEmployeeEmail != null ? assignedEmployeeEmail : employeeEmail; }
    public void setAssignedEmployeeEmail(String assignedEmployeeEmail) { this.assignedEmployeeEmail = assignedEmployeeEmail; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Long getAssignedById() { return assignedById; }
    public void setAssignedById(Long assignedById) { this.assignedById = assignedById; }

    public String getAssignedByName() { return assignedByName; }
    public void setAssignedByName(String assignedByName) { this.assignedByName = assignedByName; }

    public Long getCreatedById() { return createdById != null ? createdById : assignedById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }

    public String getCreatedByName() { return createdByName != null ? createdByName : assignedByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getCompletionNotes() { return completionNotes; }
    public void setCompletionNotes(String completionNotes) { this.completionNotes = completionNotes; }

    public String getChecklistJson() { return checklistJson; }
    public void setChecklistJson(String checklistJson) { this.checklistJson = checklistJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
