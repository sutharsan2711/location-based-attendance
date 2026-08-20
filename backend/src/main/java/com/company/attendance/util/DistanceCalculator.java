package com.company.attendance.util;

public class DistanceCalculator {

    private static final double EARTH_RADIUS_METERS = 6371000.0; // Mean radius of the Earth

    /**
     * Calculates the distance in meters between two points on the Earth's surface
     * using the Haversine formula.
     *
     * @param startLat Latitude of the starting point (e.g. Employee Latitude)
     * @param startLong Longitude of the starting point (e.g. Employee Longitude)
     * @param endLat Latitude of the ending point (e.g. Company Latitude)
     * @param endLong Longitude of the ending point (e.g. Company Longitude)
     * @return The distance between the points in meters
     */
    public static double calculateDistance(double startLat, double startLong, double endLat, double endLong) {
        double dLat = Math.toRadians(endLat - startLat);
        double dLong = Math.toRadians(endLong - startLong);

        double startLatRad = Math.toRadians(startLat);
        double endLatRad = Math.toRadians(endLat);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.sin(dLong / 2) * Math.sin(dLong / 2) *
                   Math.cos(startLatRad) * Math.cos(endLatRad);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_METERS * c;
    }
}
