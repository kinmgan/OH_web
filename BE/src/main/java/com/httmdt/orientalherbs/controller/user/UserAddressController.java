package com.httmdt.orientalherbs.controller.user;

import com.httmdt.orientalherbs.dto.UserAddressDTO;
import com.httmdt.orientalherbs.security.user.CustomUserDetails;
import com.httmdt.orientalherbs.service.user.UserAddressService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user/addresses")
@RequiredArgsConstructor
public class UserAddressController {

    private final UserAddressService userAddressService;

    @GetMapping
    public ResponseEntity<List<UserAddressDTO>> getUserAddresses(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userAddressService.getUserAddresses(userDetails.getId()));
    }

    @PostMapping
    public ResponseEntity<UserAddressDTO> addAddress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody UserAddressDTO addressDTO) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userAddressService.addAddress(userDetails.getId(), addressDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserAddressDTO> updateAddress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody UserAddressDTO addressDTO) {
        return ResponseEntity.ok(userAddressService.updateAddress(userDetails.getId(), id, addressDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        userAddressService.deleteAddress(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<Void> setDefaultAddress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        userAddressService.setDefaultAddress(userDetails.getId(), id);
        return ResponseEntity.ok().build();
    }
}
