package com.company.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class StickyNoteRequest {
    private String title;
    private String content;
    private String color = "yellow";
    private String category = "General";
    private Boolean isPinned = false;
    private String checklistJson;

    public StickyNoteRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Boolean getIsPinned() { return isPinned; }
    public void setIsPinned(Boolean isPinned) { this.isPinned = isPinned; }

    @JsonProperty("pinned")
    public void setPinned(Boolean pinned) {
        if (pinned != null) {
            this.isPinned = pinned;
        }
    }

    public String getChecklistJson() { return checklistJson; }
    public void setChecklistJson(String checklistJson) { this.checklistJson = checklistJson; }

    @JsonProperty("checklistData")
    public void setChecklistData(String checklistData) {
        if (checklistData != null) {
            this.checklistJson = checklistData;
        }
    }
}
