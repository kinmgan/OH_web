package com.httmdt.orientalherbs.security.oauth2;

import java.io.IOException;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.dao.user.UserLoginHistoryRepository;
import com.httmdt.orientalherbs.model.cart.Cart;
import com.httmdt.orientalherbs.model.enums.AuthProvider;
import com.httmdt.orientalherbs.model.enums.UserRole;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.model.user.UserLoginHistory;
import com.httmdt.orientalherbs.security.jwt.JwtUtils;
import com.httmdt.orientalherbs.service.email.EmailService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserLoginHistoryRepository loginHistoryRepository;

    @Autowired
    private EmailService emailService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String providerId = oAuth2User.getAttribute("sub");

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            if (user.getAuthProvider() == AuthProvider.LOCAL) {
                // Đã tồn tại tài khoản local với email này
                String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/auth/callback")
                        .queryParam("error", "email_in_use")
                        .build().toUriString();
                getRedirectStrategy().sendRedirect(request, response, targetUrl);
                return;
            }
        } else {
            // Tạo tài khoản mới
            user = new User();
            user.setEmail(email);
            user.setFullName(name);
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setProviderId(providerId);
            user.setRole(UserRole.ROLE_USER); // Default role
            user.setPasswordHash("GOOGLE_AUTH"); // No password for OAuth users

            Cart newCart = new Cart();
            newCart.setUser(user);
            user.setCart(newCart);

            user = userRepository.save(user);

            try {
                emailService.sendEmailAsync(email, "WELCOME_GOOGLE", java.util.Map.of(
                    "fullName", name
                ));
            } catch (Exception e) {
                System.err.println("[OAUTH] Failed to send WELCOME_GOOGLE to " + email + ": " + e.getMessage());
                e.printStackTrace();
            }
        }

        // Tạo JWT
        String token = jwtUtils.generateJwtTokenFromEmail(email);

        // Lưu lịch sử đăng nhập
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
            // Lần đầu (nếu không phải tạo mới user ở trên, mặc dù logic này an toàn cho cả hai trường hợp)
            // Tuy nhiên user mới tạo cũng sẽ trigger LOGIN_NOTIFICATION nếu k cẩn thận, 
            // nhưng vì ở đây là lastLoginOpt.isEmpty() thì coi như login mới luôn (nhưng user mới đã gửi WELCOME rồi).
            // Thôi thì cứ gửi hoặc có thể check tránh trùng.
            isNewDeviceOrIp = true; 
        }

        UserLoginHistory history = new UserLoginHistory();
        history.setUser(user);
        history.setIpAddress(currentIp);
        history.setUserAgent(currentUserAgent);
        history.setAuthMethod(AuthProvider.GOOGLE);
        loginHistoryRepository.save(history);

        if (isNewDeviceOrIp) {
            try {
                emailService.sendEmailAsync(email, "LOGIN_NOTIFICATION", java.util.Map.of(
                    "fullName", name,
                    "loginTime", java.time.LocalDateTime.now().toString()
                ));
            } catch (Exception e) {
                System.err.println("[OAUTH] Failed to send LOGIN_NOTIFICATION to " + email + ": " + e.getMessage());
                e.printStackTrace();
            }
        }

        // Redirect về FE callback
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/auth/callback")
                .queryParam("token", token)
                .build().toUriString();
        
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
