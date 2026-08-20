package com.company.attendance.repository;

import com.company.attendance.entity.CompanyLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyLocationRepository extends JpaRepository<CompanyLocation, Long> {
    // Finds the first location configuration, as we maintain only one active configuration
    Optional<CompanyLocation> findFirstByOrderByIdAsc();
}
