-- Migration: Tao bang homepage_sections de quan ly cac khoi dong tren trang chu
-- MySQL/MariaDB
CREATE TABLE IF NOT EXISTS homepage_sections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT 'Tieu de hien thi (Admin tu do dat)',
    type VARCHAR(20) NOT NULL COMMENT 'Loai khoi: CATEGORY, TOP_SALES, TOP_RATED, NEW_ARRIVALS',
    reference_id BIGINT DEFAULT NULL COMMENT 'ID danh muc (chi dung khi type = CATEGORY)',
    sort_order INT NOT NULL DEFAULT 0 COMMENT 'Thu tu hien thi',
    limit_items INT NOT NULL DEFAULT 10 COMMENT 'So san pham toi da trong khoi',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Bat/Tat hien thi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_active (is_active),
    INDEX idx_reference_id (reference_id)
);

-- PostgreSQL (uncomment if using PostgreSQL)
-- CREATE TABLE homepage_sections (
--     id BIGSERIAL PRIMARY KEY,
--     title VARCHAR(255) NOT NULL,
--     type VARCHAR(20) NOT NULL,
--     reference_id BIGINT DEFAULT NULL,
--     sort_order INT NOT NULL DEFAULT 0,
--     limit_items INT NOT NULL DEFAULT 10,
--     is_active BOOLEAN NOT NULL DEFAULT TRUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX idx_homepage_sections_type ON homepage_sections(type);
-- CREATE INDEX idx_homepage_sections_sort_order ON homepage_sections(sort_order);
-- CREATE INDEX idx_homepage_sections_is_active ON homepage_sections(is_active);
-- CREATE INDEX idx_homepage_sections_reference_id ON homepage_sections(reference_id);

-- Kiem tra bang da duoc tao
-- SELECT id, title, type, sort_order, is_active FROM homepage_sections ORDER BY sort_order;