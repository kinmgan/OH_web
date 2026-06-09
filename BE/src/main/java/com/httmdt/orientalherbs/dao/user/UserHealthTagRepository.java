package com.httmdt.orientalherbs.dao.user;

import com.httmdt.orientalherbs.model.enums.HealthCategory;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.model.user.UserHealthTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserHealthTagRepository extends JpaRepository<UserHealthTag, Long> {

    List<UserHealthTag> findByUserUserId(Long userId);

    @Query("SELECT uht.category AS category, COUNT(uht) AS count " +
           "FROM UserHealthTag uht " +
           "WHERE uht.category IS NOT NULL " +
           "GROUP BY uht.category")
    List<HealthCategoryCount> countByCategory();

    @Query("SELECT COUNT(uht) FROM UserHealthTag uht WHERE uht.category IS NOT NULL")
    long countAllWithCategory();

    @Query("SELECT DISTINCT uht.user FROM UserHealthTag uht WHERE uht.category = :category")
    List<User> findUsersByHealthTag(@Param("category") HealthCategory category);
}
