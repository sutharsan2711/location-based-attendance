package com.company.attendance.service;

import com.company.attendance.dto.HolidayRequestDto;
import com.company.attendance.dto.HolidayResponseDto;
import com.company.attendance.entity.Holiday;
import com.company.attendance.exception.ResourceNotFoundException;
import com.company.attendance.repository.HolidayRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HolidayService {

    private final HolidayRepository holidayRepository;

    public HolidayService(HolidayRepository holidayRepository) {
        this.holidayRepository = holidayRepository;
    }

    @PostConstruct
    public void initDefaultHolidays() {
        if (holidayRepository.count() == 0) {
            List<Holiday> defaults = new ArrayList<>();
            // 2026 Default Holidays
            defaults.add(new Holiday("New Year Day", LocalDate.of(2026, 1, 1), "Public Holiday", "New Year celebration", false));
            defaults.add(new Holiday("Pongal / Makar Sankranti", LocalDate.of(2026, 1, 14), "Festival Holiday", "Harvest festival", false));
            defaults.add(new Holiday("Republic Day", LocalDate.of(2026, 1, 26), "National Holiday", "Celebration of Indian Constitution", false));
            defaults.add(new Holiday("Maha Shivaratri", LocalDate.of(2026, 2, 16), "Festival Holiday", "Night of Lord Shiva", false));
            defaults.add(new Holiday("Holi", LocalDate.of(2026, 3, 4), "Festival Holiday", "Festival of colors", false));
            defaults.add(new Holiday("Good Friday", LocalDate.of(2026, 4, 3), "Public Holiday", "Christian holiday commemorating the crucifixion", false));
            defaults.add(new Holiday("May Day / Labour Day", LocalDate.of(2026, 5, 1), "Public Holiday", "International Workers' Day", false));
            defaults.add(new Holiday("Bakrid / Eid al-Adha", LocalDate.of(2026, 5, 27), "Festival Holiday", "Feast of the Sacrifice", false));
            defaults.add(new Holiday("Muharram", LocalDate.of(2026, 6, 26), "Festival Holiday", "Islamic New Year month", false));
            defaults.add(new Holiday("Independence Day", LocalDate.of(2026, 8, 15), "National Holiday", "Indian Independence Day", false));
            defaults.add(new Holiday("Vinayakar Chathurthi", LocalDate.of(2026, 9, 1), "Festival Holiday", "Ganesh Chaturthi festival", false));
            defaults.add(new Holiday("Krishna Jayanthi", LocalDate.of(2026, 9, 4), "Festival Holiday", "Janmashtami celebration", false));
            defaults.add(new Holiday("Gandhi Jayanthi", LocalDate.of(2026, 10, 1), "National Holiday", "Mahatma Gandhi's Birthday", false));
            defaults.add(new Holiday("Ayutha Pooja / Vijayadashami", LocalDate.of(2026, 10, 20), "Festival Holiday", "Dussehra & Ayudha Puja", false));
            defaults.add(new Holiday("Deepavali / Diwali", LocalDate.of(2026, 11, 8), "Festival Holiday", "Festival of Lights", false));
            defaults.add(new Holiday("Christmas Day", LocalDate.of(2026, 12, 25), "Public Holiday", "Celebration of the Nativity", false));

            holidayRepository.saveAll(defaults);
        }
    }

    public List<HolidayResponseDto> getAllHolidays(Integer year) {
        List<Holiday> holidays;
        if (year != null && year > 0) {
            holidays = holidayRepository.findByYear(year);
        } else {
            holidays = holidayRepository.findAllByOrderByHolidayDateAsc();
        }
        return holidays.stream().map(HolidayResponseDto::new).collect(Collectors.toList());
    }

    public List<HolidayResponseDto> getUpcomingHolidays() {
        LocalDate today = LocalDate.now();
        List<Holiday> holidays = holidayRepository.findByHolidayDateGreaterThanEqualOrderByHolidayDateAsc(today);
        return holidays.stream().map(HolidayResponseDto::new).collect(Collectors.toList());
    }

    public HolidayResponseDto getHolidayById(Long id) {
        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday not found with id: " + id));
        return new HolidayResponseDto(holiday);
    }

    @Transactional
    public HolidayResponseDto createHoliday(HolidayRequestDto request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Holiday name is required");
        }
        if (request.getHolidayDate() == null) {
            throw new IllegalArgumentException("Holiday date is required");
        }
        if (request.getHolidayType() == null || request.getHolidayType().trim().isEmpty()) {
            request.setHolidayType("Public Holiday");
        }

        Holiday holiday = new Holiday(
                request.getName().trim(),
                request.getHolidayDate(),
                request.getHolidayType().trim(),
                request.getDescription(),
                request.getIsOptional() != null ? request.getIsOptional() : false
        );

        Holiday saved = holidayRepository.save(holiday);
        return new HolidayResponseDto(saved);
    }

    @Transactional
    public HolidayResponseDto updateHoliday(Long id, HolidayRequestDto request) {
        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday not found with id: " + id));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            holiday.setName(request.getName().trim());
        }
        if (request.getHolidayDate() != null) {
            holiday.setHolidayDate(request.getHolidayDate());
        }
        if (request.getHolidayType() != null && !request.getHolidayType().trim().isEmpty()) {
            holiday.setHolidayType(request.getHolidayType().trim());
        }
        if (request.getDescription() != null) {
            holiday.setDescription(request.getDescription().trim());
        }
        if (request.getIsOptional() != null) {
            holiday.setIsOptional(request.getIsOptional());
        }

        Holiday updated = holidayRepository.save(holiday);
        return new HolidayResponseDto(updated);
    }

    @Transactional
    public void deleteHoliday(Long id) {
        if (!holidayRepository.existsById(id)) {
            throw new ResourceNotFoundException("Holiday not found with id: " + id);
        }
        holidayRepository.deleteById(id);
    }
}
