package com.company.attendance.dto;

import jakarta.validation.constraints.NotBlank;

public class DatabaseResetRequest {

    @NotBlank(message = "Reset type is required")
    private String resetType; // "ATTENDANCE", "LEAVES", "EMPLOYEES", "LOCATIONS", "FULL_SYSTEM_RESET"

    @NotBlank(message = "Confirmation code is required")
    private String confirmationCode; // e.g. "CONFIRM_RESET" or "CONFIRM_DELETE"

    public DatabaseResetRequest() {}

    public DatabaseResetRequest(String resetType, String confirmationCode) {
        this.resetType = resetType;
        this.confirmationCode = confirmationCode;
    }

    public String getResetType() {
        return resetType;
    }

    public void setResetType(String resetType) {
        this.resetType = resetType;
    }

    public String getConfirmationCode() {
        return confirmationCode;
    }

    public void setConfirmationCode(String confirmationCode) {
        this.confirmationCode = confirmationCode;
    }
}
