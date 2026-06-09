package com.httmdt.orientalherbs.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    @SuppressWarnings("unchecked")
    public Map<String, Object> uploadImage(MultipartFile file, String folderName) throws IOException {
        // Upload file lên Cloudinary và chỉ định thư mục lưu trữ
        Map<String, Object> uploadResult = (Map<String, Object>) cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("folder", folderName));
        
        // Trả về toàn bộ Map kết quả (chứa url, public_id, kích thước ảnh, v.v.)
        return uploadResult;
    }

    public Map deleteImage(String publicId) throws IOException {
        return cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
}