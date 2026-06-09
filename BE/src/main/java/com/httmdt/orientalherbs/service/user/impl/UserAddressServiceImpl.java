package com.httmdt.orientalherbs.service.user.impl;

import com.httmdt.orientalherbs.dao.user.UserAddressRepository;
import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.dto.UserAddressDTO;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.model.user.UserAddress;
import com.httmdt.orientalherbs.service.user.UserAddressService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserAddressServiceImpl implements UserAddressService {

    @Autowired
    private UserAddressRepository userAddressRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public List<UserAddressDTO> getUserAddresses(Long userId) {
        return userAddressRepository.findByUser_UserIdOrderByIsDefaultDescIdDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserAddressDTO addAddress(Long userId, UserAddressDTO addressDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UserAddress> existingAddresses = userAddressRepository.findByUser_UserId(userId);

        UserAddress userAddress = new UserAddress();
        userAddress.setUser(user);
        updateEntityFromDTO(userAddress, addressDTO);

        if (existingAddresses.isEmpty()) {
            userAddress.setIsDefault(true);
        } else {
            userAddress.setIsDefault(addressDTO.getIsDefault() != null ? addressDTO.getIsDefault() : false);
            if (Boolean.TRUE.equals(userAddress.getIsDefault())) {
                resetDefaultAddress(userId);
            }
        }

        UserAddress savedAddress = userAddressRepository.save(userAddress);
        return mapToDTO(savedAddress);
    }

    @Override
    @Transactional
    public UserAddressDTO updateAddress(Long userId, Long addressId, UserAddressDTO addressDTO) {
        UserAddress userAddress = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!userAddress.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        updateEntityFromDTO(userAddress, addressDTO);

        if (Boolean.TRUE.equals(addressDTO.getIsDefault()) && !Boolean.TRUE.equals(userAddress.getIsDefault())) {
            resetDefaultAddress(userId);
            userAddress.setIsDefault(true);
        } else if (Boolean.FALSE.equals(addressDTO.getIsDefault())) {
            // If we are turning off default, maybe allow? But normally user should just set
            // another as default.
            userAddress.setIsDefault(false);
        }

        UserAddress savedAddress = userAddressRepository.save(userAddress);
        return mapToDTO(savedAddress);
    }

    @Override
    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        UserAddress userAddress = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!userAddress.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        boolean wasDefault = Boolean.TRUE.equals(userAddress.getIsDefault());
        userAddressRepository.delete(userAddress);

        if (wasDefault) {
            List<UserAddress> remaining = userAddressRepository.findByUser_UserId(userId);
            if (!remaining.isEmpty()) {
                UserAddress newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                userAddressRepository.save(newDefault);
            }
        }
    }

    @Override
    @Transactional
    public void setDefaultAddress(Long userId, Long addressId) {
        UserAddress userAddress = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!userAddress.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        resetDefaultAddress(userId);
        userAddress.setIsDefault(true);
        userAddressRepository.save(userAddress);
    }

    private void resetDefaultAddress(Long userId) {
        List<UserAddress> addresses = userAddressRepository.findByUser_UserId(userId);
        for (UserAddress address : addresses) {
            if (Boolean.TRUE.equals(address.getIsDefault())) {
                address.setIsDefault(false);
                userAddressRepository.save(address);
            }
        }
    }

    private UserAddressDTO mapToDTO(UserAddress entity) {
        return UserAddressDTO.builder()
                .id(entity.getId())
                .receiverName(entity.getReceiverName())
                .phoneNumber(entity.getPhoneNumber())
                .provinceId(entity.getProvinceId())
                .provinceName(entity.getProvinceName())
                .districtId(entity.getDistrictId())
                .districtName(entity.getDistrictName())
                .wardCode(entity.getWardCode())
                .wardName(entity.getWardName())
                .detailedAddress(entity.getDetailedAddress())
                .isDefault(entity.getIsDefault())
                .build();
    }

    private void updateEntityFromDTO(UserAddress entity, UserAddressDTO dto) {
        entity.setReceiverName(dto.getReceiverName());
        entity.setPhoneNumber(dto.getPhoneNumber());
        entity.setProvinceId(dto.getProvinceId());
        entity.setProvinceName(dto.getProvinceName());
        entity.setDistrictId(dto.getDistrictId());
        entity.setDistrictName(dto.getDistrictName());
        entity.setWardCode(dto.getWardCode());
        entity.setWardName(dto.getWardName());
        entity.setDetailedAddress(dto.getDetailedAddress());
    }
}
