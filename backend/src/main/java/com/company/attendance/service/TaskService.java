package com.company.attendance.service;

import com.company.attendance.dto.TaskRequest;
import com.company.attendance.dto.TaskResponse;
import com.company.attendance.dto.TaskStatusUpdateRequest;
import com.company.attendance.entity.Task;
import com.company.attendance.entity.User;
import com.company.attendance.enums.Role;
import com.company.attendance.enums.TaskPriority;
import com.company.attendance.enums.TaskStatus;
import com.company.attendance.repository.TaskRepository;
import com.company.attendance.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Unauthenticated user");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + auth.getName()));
    }

    @Transactional
    public TaskResponse createTask(TaskRequest req) {
        User admin = getCurrentUser();
        User employee = userRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Assigned employee not found with ID: " + req.getEmployeeId()));

        Task task = new Task();
        task.setTitle(req.getTitle());
        task.setDescription(req.getDescription());
        task.setAssignedEmployee(employee);
        task.setAssignedBy(admin);
        task.setDepartment(req.getDepartment() != null ? req.getDepartment() : employee.getDepartment());
        task.setPriority(req.getPriority() != null ? req.getPriority() : TaskPriority.MEDIUM);
        task.setStatus(req.getStatus() != null ? req.getStatus() : TaskStatus.PENDING);
        task.setStartDate(req.getStartDate() != null ? req.getStartDate() : LocalDate.now(KOLKATA_ZONE));
        task.setDueDate(req.getDueDate());
        task.setChecklistJson(req.getChecklistJson());

        Task saved = taskRepository.save(task);
        return TaskResponse.fromEntity(saved);
    }

    public List<TaskResponse> getAllTasks(Long employeeId, String department, TaskStatus status, TaskPriority priority) {
        List<Task> tasks = taskRepository.findByFilters(employeeId, department, status, priority);
        return tasks.stream().map(TaskResponse::fromEntity).toList();
    }

    public List<TaskResponse> getMyTasks(TaskStatus status) {
        User employee = getCurrentUser();
        List<Task> tasks;
        if (status != null) {
            tasks = taskRepository.findByAssignedEmployeeAndStatusOrderByCreatedAtDesc(employee, status);
        } else {
            tasks = taskRepository.findByAssignedEmployeeOrderByCreatedAtDesc(employee);
        }
        return tasks.stream().map(TaskResponse::fromEntity).toList();
    }

    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with ID: " + id));
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest req) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with ID: " + id));

        if (req.getTitle() != null) task.setTitle(req.getTitle());
        if (req.getDescription() != null) task.setDescription(req.getDescription());
        if (req.getEmployeeId() != null) {
            User employee = userRepository.findById(req.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Assigned employee not found with ID: " + req.getEmployeeId()));
            task.setAssignedEmployee(employee);
            if (req.getDepartment() == null) {
                task.setDepartment(employee.getDepartment());
            }
        }
        if (req.getDepartment() != null) task.setDepartment(req.getDepartment());
        if (req.getPriority() != null) task.setPriority(req.getPriority());
        if (req.getStatus() != null) task.setStatus(req.getStatus());
        if (req.getStartDate() != null) task.setStartDate(req.getStartDate());
        if (req.getDueDate() != null) task.setDueDate(req.getDueDate());
        if (req.getChecklistJson() != null) task.setChecklistJson(req.getChecklistJson());

        Task updated = taskRepository.save(task);
        return TaskResponse.fromEntity(updated);
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, TaskStatusUpdateRequest req) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with ID: " + id));

        User currentUser = getCurrentUser();
        // Employees can only update their own tasks; Admins can update any
        if (currentUser.getRole() != Role.ADMIN && !task.getAssignedEmployee().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Access denied: You can only update tasks assigned to you.");
        }

        if (req.getStatus() != null) task.setStatus(req.getStatus());
        if (req.getCompletionNotes() != null) task.setCompletionNotes(req.getCompletionNotes());
        if (req.getChecklistJson() != null) task.setChecklistJson(req.getChecklistJson());

        Task updated = taskRepository.save(task);
        return TaskResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new RuntimeException("Task not found with ID: " + id);
        }
        taskRepository.deleteById(id);
    }

    public Map<String, Object> getTaskStats() {
        User currentUser = getCurrentUser();
        LocalDate today = LocalDate.now(KOLKATA_ZONE);
        Map<String, Object> stats = new HashMap<>();

        if (currentUser.getRole() == Role.ADMIN) {
            stats.put("total", taskRepository.count());
            stats.put("pending", taskRepository.countByStatus(TaskStatus.PENDING));
            stats.put("inProgress", taskRepository.countByStatus(TaskStatus.IN_PROGRESS));
            stats.put("underReview", taskRepository.countByStatus(TaskStatus.UNDER_REVIEW));
            stats.put("completed", taskRepository.countByStatus(TaskStatus.COMPLETED));
            stats.put("cancelled", taskRepository.countByStatus(TaskStatus.CANCELLED));
            stats.put("overdue", taskRepository.countOverdueTasks(today));
        } else {
            List<Task> myTasks = taskRepository.findByAssignedEmployeeOrderByCreatedAtDesc(currentUser);
            long total = myTasks.size();
            long pending = myTasks.stream().filter(t -> t.getStatus() == TaskStatus.PENDING).count();
            long inProgress = myTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
            long underReview = myTasks.stream().filter(t -> t.getStatus() == TaskStatus.UNDER_REVIEW).count();
            long completed = myTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
            long overdue = taskRepository.countEmployeeOverdueTasks(currentUser, today);

            stats.put("total", total);
            stats.put("pending", pending);
            stats.put("inProgress", inProgress);
            stats.put("underReview", underReview);
            stats.put("completed", completed);
            stats.put("overdue", overdue);
        }

        return stats;
    }
}
