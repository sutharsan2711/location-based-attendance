package com.company.attendance.dto;

import com.company.attendance.entity.Holiday;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class HolidayResponseDto {

    private Long id;
    private String name;
    private LocalDate holidayDate;
    private String formattedDate; // e.g. "01 Jan 2026"
    private String dayOfWeek;     // e.g. "Thursday"
    private String holidayType;   // "Public Holiday", "National Holiday", etc.
    private String description;
    private Boolean isOptional;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");

    public HolidayResponseDto() {}

    public HolidayResponseDto(Holiday holiday) {
        this.id = holiday.getId();
        this.name = holiday.getName();
        this.holidayDate = holiday.getHolidayDate();
        if (holiday.getHolidayDate() != null) {
            this.formattedDate = holiday.getHolidayDate().format(FORMATTER);
            if (holiday.getDayOfWeek() != null && !holiday.getDayOfWeek().isEmpty()) {
                this.dayOfWeek = holiday.getDayOfWeek();
            } else {
                String d = holiday.getHolidayDate().getDayOfWeek().name().toLowerCase();
                this.dayOfWeek = d.substring(0, 1).toUpperCase() + d.substring(1);
            }
        }
        this.holidayType = holiday.getHolidayType();
        this.description = holiday.getDescription();
        this.isOptional = holiday.getIsOptional();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getHolidayDate() {
        return holidayDate;
    }

    public void setHolidayDate(LocalDate holidayDate) {
        this.holidayDate = holidayDate;
    }

    public String getFormattedDate() {
        return formattedDate;
    }

    public void setFormattedDate(String formattedDate) {
        this.formattedDate = formattedDate;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public String getHolidayType() {
        return holidayType;
    }

    public void setHolidayType(String holidayType) {
        this.holidayType = holidayType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsOptional() {
        return isOptional;
    }

    public void setIsOptional(Boolean isOptional) {
        this.isOptional = isOptional;
    }
}
