package com.httmdt.orientalherbs.config;

import com.httmdt.orientalherbs.model.enums.UserRole;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.dao.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@orientalherbs.com";
    private static final String ADMIN_PASSWORD = "admin123";
    private static final String ADMIN_FULLNAME = "Quản trị viên";

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail(ADMIN_EMAIL).isEmpty()) {
            User admin = new User();
            admin.setEmail(ADMIN_EMAIL);
            admin.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
            admin.setFullName(ADMIN_FULLNAME);
            admin.setRole(UserRole.ROLE_ADMIN);
            userRepository.save(admin);
            log.info("Created default admin user: {} / {}", ADMIN_EMAIL, ADMIN_PASSWORD);
        } else {
            log.info("Admin user already exists.");
        }
    }
}
