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
            String defaultHash = passwordEncoder.encode("123456789");
            List<User> users = userRepository.findAll();
            for (User u : users) {
                // Ensure all users can login with 123456789
                u.setPassword(defaultHash);
                userRepository.save(u);
            }
            System.out.println("Initialized password '123456789' for " + users.size() + " user accounts.");
        };
    }
}
