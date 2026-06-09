package com.httmdt.orientalherbs.dto.auth;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JwtResponse {
    private String token;
    private Long id;
    private String email;
    private String fullName;
    private String role;
    
    public JwtResponse(String token, Long id, String email, String fullName, String role) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
    }
}