package com.httmdt.orientalherbs.service.auth;

import com.httmdt.orientalherbs.dto.auth.LoginRequest;
import com.httmdt.orientalherbs.dto.auth.RegisterRequest;

public interface AuthService {
    String authenticateUser(LoginRequest request);

    void registerUser(RegisterRequest signUpRequest);
}
