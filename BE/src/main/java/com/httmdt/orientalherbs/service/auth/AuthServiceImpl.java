package com.httmdt.orientalherbs.service.auth;

import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.dto.auth.LoginRequest;
import com.httmdt.orientalherbs.dto.auth.RegisterRequest;
import com.httmdt.orientalherbs.model.cart.Cart;
import com.httmdt.orientalherbs.model.enums.UserRole;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.security.jwt.JwtUtils;
import com.httmdt.orientalherbs.model.enums.AuthProvider;
import com.httmdt.orientalherbs.model.user.UserLoginHistory;
import com.httmdt.orientalherbs.dao.user.UserLoginHistoryRepository;
import com.httmdt.orientalherbs.service.email.EmailService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.NoArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@NoArgsConstructor
@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    @org.springframework.context.annotation.Lazy
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private HttpServletRequest request;

    @Autowired
    private UserLoginHistoryRepository loginHistoryRepository;

    @Autowired
    private EmailService emailService;

    public String authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        com.httmdt.orientalherbs.security.user.CustomUserDetails userDetails = (com.httmdt.orientalherbs.security.user.CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user != null) {
            String currentIp = request.getRemoteAddr();
            String currentUserAgent = request.getHeader("User-Agent");
            
            java.util.Optional<UserLoginHistory> lastLoginOpt = loginHistoryRepository.findTopByUserOrderByLoginAtDesc(user);
            boolean isNewDeviceOrIp = false;
            
            if (lastLoginOpt.isPresent()) {
                UserLoginHistory lastLogin = lastLoginOpt.get();
                if (!java.util.Objects.equals(lastLogin.getIpAddress(), currentIp) || 
                    !java.util.Objects.equals(lastLogin.getUserAgent(), currentUserAgent)) {
                    isNewDeviceOrIp = true;
                }
            } else {
                isNewDeviceOrIp = true;
            }
            
            UserLoginHistory history = new UserLoginHistory();
            history.setUser(user);
            history.setIpAddress(currentIp);
            history.setUserAgent(currentUserAgent);
            history.setAuthMethod(AuthProvider.LOCAL);
            loginHistoryRepository.save(history);
            
            if (isNewDeviceOrIp) {
                try {
                    emailService.sendEmailAsync(user.getEmail(), "LOGIN_NOTIFICATION", java.util.Map.of(
                        "fullName", user.getFullName(),
                        "loginTime", java.time.LocalDateTime.now().toString()
                    ));
                } catch (Exception e) {
                    System.err.println("[AUTH] Failed to send LOGIN_NOTIFICATION to " + user.getEmail() + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }

        return jwtUtils.generateJwtToken(authentication);
    }

    @Transactional
    public void registerUser(RegisterRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User();
        user.setFullName(signUpRequest.getFullName());
        user.setEmail(signUpRequest.getEmail());
        user.setPasswordHash(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setRole(UserRole.ROLE_USER); // Mặc định role user
        user.setCreatedAt(LocalDateTime.now());

        Cart newCart = new Cart();

        // Bắt buộc phải set liên kết 2 chiều để Hibernate hiểu
        newCart.setUser(user);
        user.setCart(newCart);

        userRepository.save(user);

        try {
            emailService.sendEmailAsync(user.getEmail(), "WELCOME_EMAIL", java.util.Map.of(
                "fullName", user.getFullName()
            ));
        } catch (Exception e) {
            System.err.println("[AUTH] Failed to send WELCOME_EMAIL to " + user.getEmail() + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}