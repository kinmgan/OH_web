package com.httmdt.orientalherbs.service.user;

import com.httmdt.orientalherbs.dto.UserAddressDTO;
import java.util.List;

public interface UserAddressService {
    List<UserAddressDTO> getUserAddresses(Long userId);

    UserAddressDTO addAddress(Long userId, UserAddressDTO addressDTO);

    UserAddressDTO updateAddress(Long userId, Long addressId, UserAddressDTO addressDTO);

    void deleteAddress(Long userId, Long addressId);

    void setDefaultAddress(Long userId, Long addressId);
}
