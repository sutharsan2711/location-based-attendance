package com.company.attendance.repository;

import com.company.attendance.entity.User;
import com.company.attendance.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeCode(String employeeCode);
    boolean existsByEmail(String email);
    boolean existsByEmployeeCode(String employeeCode);
    List<User> findByRole(Role role);
    List<User> findByRoleNot(Role role);
    List<User> findByRoleIn(List<Role> roles);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM User u WHERE u.role != :role")
    void deleteByRoleNot(@org.springframework.data.repository.query.Param("role") Role role);
}
