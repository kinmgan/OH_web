package com.httmdt.orientalherbs.dao.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.model.user.UserLoginHistory;

@Repository
public interface UserLoginHistoryRepository extends JpaRepository<UserLoginHistory, Long> {
    
    // Lấy lần đăng nhập gần nhất của user
    Optional<UserLoginHistory> findTopByUserOrderByLoginAtDesc(User user);
}
