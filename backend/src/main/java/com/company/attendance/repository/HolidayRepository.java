package com.company.attendance.repository;

import com.company.attendance.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    List<Holiday> findAllByOrderByHolidayDateAsc();

    List<Holiday> findByHolidayDateBetweenOrderByHolidayDateAsc(LocalDate startDate, LocalDate endDate);

    List<Holiday> findByHolidayDateGreaterThanEqualOrderByHolidayDateAsc(LocalDate date);

    @Query("SELECT h FROM Holiday h WHERE YEAR(h.holidayDate) = :year ORDER BY h.holidayDate ASC")
    List<Holiday> findByYear(@Param("year") int year);

    boolean existsByHolidayDateAndName(LocalDate holidayDate, String name);
}
