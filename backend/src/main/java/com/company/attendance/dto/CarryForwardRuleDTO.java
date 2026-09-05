package com.company.attendance.dto;

public class CarryForwardRuleDTO {
    private int fromYear;
    private int toYear;
    private double maxCasualLeaveCap = 3.0;
    private double maxSickLeaveCap = 5.0;
    private double maxCompOffCap = 2.0;
    private boolean enableCasualLeave = true;
    private boolean enableSickLeave = true;
    private boolean enableCompOff = true;

    public CarryForwardRuleDTO() {}

    public int getFromYear() { return fromYear; }
    public void setFromYear(int fromYear) { this.fromYear = fromYear; }

    public int getToYear() { return toYear; }
    public void setToYear(int toYear) { this.toYear = toYear; }

    public double getMaxCasualLeaveCap() { return maxCasualLeaveCap; }
    public void setMaxCasualLeaveCap(double maxCasualLeaveCap) { this.maxCasualLeaveCap = maxCasualLeaveCap; }

    public double getMaxSickLeaveCap() { return maxSickLeaveCap; }
    public void setMaxSickLeaveCap(double maxSickLeaveCap) { this.maxSickLeaveCap = maxSickLeaveCap; }

    public double getMaxCompOffCap() { return maxCompOffCap; }
    public void setMaxCompOffCap(double maxCompOffCap) { this.maxCompOffCap = maxCompOffCap; }

    public boolean isEnableCasualLeave() { return enableCasualLeave; }
    public void setEnableCasualLeave(boolean enableCasualLeave) { this.enableCasualLeave = enableCasualLeave; }

    public boolean isEnableSickLeave() { return enableSickLeave; }
    public void setEnableSickLeave(boolean enableSickLeave) { this.enableSickLeave = enableSickLeave; }

    public boolean isEnableCompOff() { return enableCompOff; }
    public void setEnableCompOff(boolean enableCompOff) { this.enableCompOff = enableCompOff; }
}
