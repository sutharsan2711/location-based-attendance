package com.company.attendance.dto;

import java.util.ArrayList;
import java.util.List;

public class LeaveBalanceItemDTO {
    private String type;
    private String title;
    private double granted;
    private double consumed;
    private double balance;
    private List<LeaveDetailItemDTO> breakdown = new ArrayList<>();

    public LeaveBalanceItemDTO() {}

    public LeaveBalanceItemDTO(String type, String title, double granted, double consumed, double balance) {
        this.type = type;
        this.title = title;
        this.granted = granted;
        this.consumed = consumed;
        this.balance = balance;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public double getGranted() { return granted; }
    public void setGranted(double granted) { this.granted = granted; }

    public double getConsumed() { return consumed; }
    public void setConsumed(double consumed) { this.consumed = consumed; }

    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }

    public List<LeaveDetailItemDTO> getBreakdown() { return breakdown; }
    public void setBreakdown(List<LeaveDetailItemDTO> breakdown) { this.breakdown = breakdown; }
}
