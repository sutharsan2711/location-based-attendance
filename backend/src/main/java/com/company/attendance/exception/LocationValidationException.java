package com.company.attendance.exception;

public class LocationValidationException extends RuntimeException {
    private final Double distance;
    private final Double allowedRadius;

    public LocationValidationException(String message) {
        super(message);
        this.distance = null;
        this.allowedRadius = null;
    }

    public LocationValidationException(String message, Double distance, Double allowedRadius) {
        super(message);
        this.distance = distance;
        this.allowedRadius = allowedRadius;
    }

    public Double getDistance() { return distance; }
    public Double getAllowedRadius() { return allowedRadius; }
}
