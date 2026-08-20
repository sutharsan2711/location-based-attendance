package com.company.attendance.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class DistanceCalculatorTest {

    private static final double COMPANY_LAT = 11.123456;
    private static final double COMPANY_LNG = 78.123456;
    private static final double EARTH_RADIUS = 6371000.0;

    @Test
    public void testDistanceCalculations() {
        // 0 meters (exact same coordinates)
        double dist0 = DistanceCalculator.calculateDistance(COMPANY_LAT, COMPANY_LNG, COMPANY_LAT, COMPANY_LNG);
        assertEquals(0.0, dist0, 0.1, "Distance should be exactly 0 meters");

        // 25 meters
        double deltaLat25 = (25.0 / EARTH_RADIUS) * (180.0 / Math.PI);
        double dist25 = DistanceCalculator.calculateDistance(COMPANY_LAT, COMPANY_LNG, COMPANY_LAT + deltaLat25, COMPANY_LNG);
        assertEquals(25.0, dist25, 0.5, "Distance should be close to 25 meters");

        // 49 meters
        double deltaLat49 = (49.0 / EARTH_RADIUS) * (180.0 / Math.PI);
        double dist49 = DistanceCalculator.calculateDistance(COMPANY_LAT, COMPANY_LNG, COMPANY_LAT + deltaLat49, COMPANY_LNG);
        assertEquals(49.0, dist49, 0.5, "Distance should be close to 49 meters");

        // 50 meters
        double deltaLat50 = (50.0 / EARTH_RADIUS) * (180.0 / Math.PI);
        double dist50 = DistanceCalculator.calculateDistance(COMPANY_LAT, COMPANY_LNG, COMPANY_LAT + deltaLat50, COMPANY_LNG);
        assertEquals(50.0, dist50, 0.5, "Distance should be close to 50 meters");

        // 51 meters
        double deltaLat51 = (51.0 / EARTH_RADIUS) * (180.0 / Math.PI);
        double dist51 = DistanceCalculator.calculateDistance(COMPANY_LAT, COMPANY_LNG, COMPANY_LAT + deltaLat51, COMPANY_LNG);
        assertEquals(51.0, dist51, 0.5, "Distance should be close to 51 meters");

        // 100 meters
        double deltaLat100 = (100.0 / EARTH_RADIUS) * (180.0 / Math.PI);
        double dist100 = DistanceCalculator.calculateDistance(COMPANY_LAT, COMPANY_LNG, COMPANY_LAT + deltaLat100, COMPANY_LNG);
        assertEquals(100.0, dist100, 0.5, "Distance should be close to 100 meters");
    }
}
