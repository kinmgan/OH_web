package com.httmdt.orientalherbs.security.jwt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.httmdt.orientalherbs.security.user.CustomUserDetailsService;
import org.springframework.stereotype.Component;
import java.io.IOException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuthTokenFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            // Lấy JWT từ request
            String jwt = parseJwt(request);

            // Nếu có JWT và hợp lệ
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                // Lấy email từ chuỗi jwt
                String email = jwtUtils.getUserNameFromJwtToken(jwt);

                // Load thông tin user từ database
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // Set thông tin Authentication vào Security Context
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            System.err.println("Cannot set user authentication: " + e.getMessage());
        }

        // Chuyển request đi tiếp tới các Filter khác hoặc tới Controller
        filterChain.doFilter(request, response);
    }

    // Hàm bóc tách token từ Header Authorization (có dạng "Bearer {token}")
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }

}
