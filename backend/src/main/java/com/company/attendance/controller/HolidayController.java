package com.company.attendance.controller;

import com.company.attendance.dto.HolidayRequestDto;
import com.company.attendance.dto.HolidayResponseDto;
import com.company.attendance.service.HolidayService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/holidays")
public class HolidayController {

    private final HolidayService holidayService;

    public HolidayController(HolidayService holidayService) {
        this.holidayService = holidayService;
    }

    @GetMapping
    public ResponseEntity<List<HolidayResponseDto>> getAllHolidays(@RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(holidayService.getAllHolidays(year));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<HolidayResponseDto>> getUpcomingHolidays() {
        return ResponseEntity.ok(holidayService.getUpcomingHolidays());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HolidayResponseDto> getHolidayById(@PathVariable Long id) {
        return ResponseEntity.ok(holidayService.getHolidayById(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createHoliday(@RequestBody HolidayRequestDto request) {
        HolidayResponseDto created = holidayService.createHoliday(request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Holiday created successfully");
        response.put("holiday", created);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateHoliday(@PathVariable Long id, @RequestBody HolidayRequestDto request) {
        HolidayResponseDto updated = holidayService.updateHoliday(id, request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Holiday updated successfully");
        response.put("holiday", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteHoliday(@PathVariable Long id) {
        holidayService.deleteHoliday(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Holiday deleted successfully");
        return ResponseEntity.ok(response);
    }
}
