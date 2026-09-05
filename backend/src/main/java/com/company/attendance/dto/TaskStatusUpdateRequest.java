package com.company.attendance.dto;

import com.company.attendance.enums.TaskStatus;

public class TaskStatusUpdateRequest {
    private TaskStatus status;
    private String completionNotes;
    private String checklistJson;

    public TaskStatusUpdateRequest() {}

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public String getCompletionNotes() { return completionNotes; }
    public void setCompletionNotes(String completionNotes) { this.completionNotes = completionNotes; }

    public String getChecklistJson() { return checklistJson; }
    public void setChecklistJson(String checklistJson) { this.checklistJson = checklistJson; }
}
