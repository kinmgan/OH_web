-- Migration: Thêm cột category vào bảng user_health_tags
-- Chạy script này để thêm cột mới cho biểu đồ radar sức khỏe

-- MySQL/MariaDB
ALTER TABLE user_health_tags
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT NULL
AFTER status;

-- Nếu sử dụng PostgreSQL, dùng:
-- ALTER TABLE user_health_tags ADD COLUMN category VARCHAR(50);

-- Kiểm tra cột đã được thêm
-- SELECT id, tag_name, status, category, notes FROM user_health_tags LIMIT 10;
