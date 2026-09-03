package com.company.attendance;

import com.company.attendance.entity.User;
import com.company.attendance.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@SpringBootApplication
public class AttendanceSystemApplication {
    public static void main(String[] args) {
        SpringApplication.run(AttendanceSystemApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDefaultPasswords(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Ensure Admin Account exists
            User admin = userRepository.findByEmail("admin@eclearnix.com")
                    .or(() -> userRepository.findByEmployeeCode("EMP000"))
                    .orElse(null);

            if (admin == null) {
                admin = new User();
                admin.setEmployeeCode("EMP000");
                admin.setName("System Admin");
                admin.setEmail("admin@eclearnix.com");
                admin.setRole(com.company.attendance.enums.Role.ADMIN);
                admin.setStatus(com.company.attendance.enums.UserStatus.ACTIVE);
                admin.setDepartment("Management");
                admin.setPassword(passwordEncoder.encode("admin@123"));
                userRepository.save(admin);
                System.out.println("Created default Admin account: admin@eclearnix.com with password 'admin@123'");
            } else {
                // Ensure admin password hash is updated to accept admin@123
                admin.setPassword(passwordEncoder.encode("admin@123"));
                userRepository.save(admin);
            }

            // 2. Ensure non-admin employees have default password '123456789'
            String defaultHash = passwordEncoder.encode("123456789");
            List<User> nonAdmins = userRepository.findByRoleNot(com.company.attendance.enums.Role.ADMIN);
            for (User u : nonAdmins) {
                if (u.getPassword() == null || u.getPassword().isEmpty()) {
                    u.setPassword(defaultHash);
                    userRepository.save(u);
                }
            }
        };
    }
}
