package com.httmdt.orientalherbs.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Data
@Configuration
@ConfigurationProperties(prefix = "payment")
public class PaymentConfig {

    private Vnpay vnpay = new Vnpay();
    private Momo momo = new Momo();
    private ZaloPay zalopay = new ZaloPay();
    private BankTransfer bank = new BankTransfer();

    @Data
    public static class Vnpay {
        private String tmnCode;
        private String hashSecret;
        private String url;
        private String returnUrl;
        private String ipnUrl;
    }

    @Data
    public static class Momo {
        private String partnerCode;
        private String accessKey;
        private String secretKey;
        private String apiUrl;
        private String redirectUrl;
        private String ipnUrl;
    }

    @Data
    public static class ZaloPay {
        private String appId;
        private String key1;
        private String key2;
        private String apiUrl;
        private String callbackUrl;
    }

    @Data
    public static class BankTransfer {
        private String accountNumber;
        private String accountName;
        private String bankName;
        private String bankBin;
    }
}
