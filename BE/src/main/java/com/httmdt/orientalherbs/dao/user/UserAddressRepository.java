package com.httmdt.orientalherbs.dao.user;

import com.httmdt.orientalherbs.model.user.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    List<UserAddress> findByUser_UserId(Long userId);

    List<UserAddress> findByUser_UserIdOrderByIsDefaultDescIdDesc(Long userId);
}
