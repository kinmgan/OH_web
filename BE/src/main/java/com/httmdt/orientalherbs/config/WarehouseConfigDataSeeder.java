package com.httmdt.orientalherbs.config;

import com.httmdt.orientalherbs.dao.WarehouseConfigRepository;
import com.httmdt.orientalherbs.model.WarehouseConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WarehouseConfigDataSeeder implements CommandLineRunner {

    private final WarehouseConfigRepository warehouseConfigRepository;

    @Override
    public void run(String... args) {
        if (warehouseConfigRepository.count() == 0) {
            WarehouseConfig config = new WarehouseConfig();
            config.setDetailedAddress("Xã Ngọc Liệp, Huyện Quốc Oai, Hà Nội, Việt Nam");
            config.setDistrictId(2004);
            config.setDistrictName("Huyện Quốc Oai");
            config.setIsActive(true);
            config.setPhone("0337074337");
            config.setProvinceId(201);
            config.setProvinceName("Hà Nội");
            config.setWardCode("1B2011");
            config.setWardName("Xã Ngọc Liệp");
            config.setWarehouseName("Kho Ngọc Liệp - Quốc Oai");

            warehouseConfigRepository.save(config);
            System.out.println("Default Warehouse Config seeded successfully.");
        }
    }
}
