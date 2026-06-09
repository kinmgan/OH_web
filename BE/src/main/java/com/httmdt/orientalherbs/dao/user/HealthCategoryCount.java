package com.httmdt.orientalherbs.dao.user;

import com.httmdt.orientalherbs.model.enums.HealthCategory;

public interface HealthCategoryCount {
    HealthCategory getCategory();
    long getCount();
}
