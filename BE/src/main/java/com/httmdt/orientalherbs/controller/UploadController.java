package com.httmdt.orientalherbs.controller;

import com.httmdt.orientalherbs.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/upload")
public class UploadController {

    @Autowired
    private CloudinaryService cloudinaryService;

    @PostMapping("/image")
    public ResponseEntity<Map<String, Object>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "duoc_lieu_products") String folder) {

        Map<String, Object> response = new HashMap<>();

        // Kiểm tra xem file có rỗng không
        if (file.isEmpty()) {
            response.put("success", false);
            response.put("message", "File ảnh trống!");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        try {
            // Gọi Service để upload
            Map<String, Object> uploadResult = cloudinaryService.uploadImage(file, folder);

            // Rút trích các thông tin cần thiết từ Cloudinary trả về
            String fileUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.get("public_id").toString();

            response.put("success", true);
            response.put("message", "Upload thành công!");
            response.put("url", fileUrl);
            response.put("public_id", publicId);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi hệ thống khi upload ảnh: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}