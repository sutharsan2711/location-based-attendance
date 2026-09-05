package com.company.attendance.dto;

public class LeaveWithdrawRequest {
    private String withdrawalReason;

    public LeaveWithdrawRequest() {}

    public LeaveWithdrawRequest(String withdrawalReason) {
        this.withdrawalReason = withdrawalReason;
    }

    public String getWithdrawalReason() {
        return withdrawalReason;
    }

    public void setWithdrawalReason(String withdrawalReason) {
        this.withdrawalReason = withdrawalReason;
    }
}
