package com.httmdt.orientalherbs.controller.user;

import com.httmdt.orientalherbs.dto.user.ChangePasswordRequest;
import com.httmdt.orientalherbs.dto.user.UpdateProfileRequest;
import com.httmdt.orientalherbs.dto.user.UserProfileDTO;
import com.httmdt.orientalherbs.dto.user.ChangeEmailRequest;
import com.httmdt.orientalherbs.dto.user.VerifyEmailChangeRequest;
import com.httmdt.orientalherbs.security.user.CustomUserDetails;
import com.httmdt.orientalherbs.service.user.UserService;
import com.httmdt.orientalherbs.service.user.EmailChangeService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/profile")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final EmailChangeService emailChangeService;

    @GetMapping
    public ResponseEntity<UserProfileDTO> getUserProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userService.getUserProfile(userDetails.getId()));
    }

    @PutMapping
    public ResponseEntity<UserProfileDTO> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateUserProfile(userDetails.getId(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userDetails.getId(), request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/email/request-otp")
    public ResponseEntity<Void> requestEmailChangeOtp(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangeEmailRequest request) {
        emailChangeService.requestOtp(userDetails.getId(), request.getNewEmail());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/email/verify-otp")
    public ResponseEntity<Void> verifyEmailChangeOtp(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody VerifyEmailChangeRequest request) {
        emailChangeService.verifyAndChangeEmail(userDetails.getId(), request.getNewEmail(), request.getOtpCode());
        return ResponseEntity.ok().build();
    }
}
