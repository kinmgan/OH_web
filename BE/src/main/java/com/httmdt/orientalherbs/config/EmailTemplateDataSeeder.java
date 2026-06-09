package com.httmdt.orientalherbs.config;

import com.httmdt.orientalherbs.dao.email.EmailTemplateRepository;
import com.httmdt.orientalherbs.model.email.EmailTemplate;
import com.httmdt.orientalherbs.model.enums.EmailTemplateType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class EmailTemplateDataSeeder implements ApplicationRunner {

    @Autowired
    private EmailTemplateRepository repository;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (repository.count() == 0) {
            System.out.println("Seeding Email Templates...");
            
            // 1. LOGIN_NOTIFICATION
            EmailTemplate loginTemplate = new EmailTemplate();
            loginTemplate.setTemplateCode("LOGIN_NOTIFICATION");
            loginTemplate.setTemplateType(EmailTemplateType.TRANSACTIONAL);
            loginTemplate.setName("Cảnh báo Đăng nhập Mới");
            loginTemplate.setSubject("Cảnh báo: Đăng nhập mới từ thiết bị lạ - Oriental Herbs");
            loginTemplate.setBodyHtml("<h2>Xin chào {{fullName}},</h2><p>Tài khoản của bạn vừa được đăng nhập từ một thiết bị hoặc trình duyệt mới.</p><p>Thời gian: {{loginTime}}</p>");
            repository.save(loginTemplate);

            // 2. WELCOME_GOOGLE
            EmailTemplate welcomeGoogleTemplate = new EmailTemplate();
            welcomeGoogleTemplate.setTemplateCode("WELCOME_GOOGLE");
            welcomeGoogleTemplate.setTemplateType(EmailTemplateType.TRANSACTIONAL);
            welcomeGoogleTemplate.setName("Chào mừng (Đăng nhập Google)");
            welcomeGoogleTemplate.setSubject("Chào mừng bạn đến với Oriental Herbs!");
            welcomeGoogleTemplate.setBodyHtml("<h2>Xin chào {{fullName}},</h2><p>Cảm ơn bạn đã tham gia Oriental Herbs bằng tài khoản Google. Hãy bắt đầu khám phá ngay!</p>");
            repository.save(welcomeGoogleTemplate);

            // 3. WELCOME_EMAIL
            EmailTemplate welcomeEmailTemplate = new EmailTemplate();
            welcomeEmailTemplate.setTemplateCode("WELCOME_EMAIL");
            welcomeEmailTemplate.setTemplateType(EmailTemplateType.TRANSACTIONAL);
            welcomeEmailTemplate.setName("Chào mừng (Đăng ký thường)");
            welcomeEmailTemplate.setSubject("Chào mừng bạn đến với Oriental Herbs!");
            welcomeEmailTemplate.setBodyHtml("""

                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2d5016;">Xin chào {{fullName}},</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Oriental Herbs</strong>!</p>
                    <p>Rất vui được đồng hành cùng bạn trên hành trình chăm sóc sức khỏe bằng các sản phẩm thảo dược tự nhiên.</p>
                    <p>Hãy bắt đầu khám phá các sản phẩm của chúng tôi ngay hôm nay.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">Trân trọng,<br>Đội ngũ Oriental Herbs</p>
                </div>

                """);
            repository.save(welcomeEmailTemplate);

            // 4. ORDER_SUCCESS
            EmailTemplate orderSuccessTemplate = new EmailTemplate();
            orderSuccessTemplate.setTemplateCode("ORDER_SUCCESS");
            orderSuccessTemplate.setTemplateType(EmailTemplateType.TRANSACTIONAL);
            orderSuccessTemplate.setName("Xác nhận đặt hàng thành công");
            orderSuccessTemplate.setSubject("Xác nhận đơn hàng #{{orderId}} - Oriental Herbs");
            orderSuccessTemplate.setBodyHtml("""

                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2d5016;">Xin chào {{fullName}},</h2>
                    <p>Cảm ơn bạn đã đặt hàng tại <strong>Oriental Herbs</strong>!</p>
                    <p>Đơn hàng <strong>#{{orderId}}</strong> của bạn đã được tiếp nhận.</p>

                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tổng tiền:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">{{totalAmount}}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Phương thức thanh toán:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">{{paymentMethod}}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Địa chỉ giao hàng:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">{{shippingAddress}}</td>
                        </tr>
                    </table>

                    <p>Chúng tôi sẽ thông báo khi đơn hàng được xác nhận và vận chuyển.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">Trân trọng,<br>Đội ngũ Oriental Herbs</p>
                </div>

                """);
            repository.save(orderSuccessTemplate);

            // 5. FORGOT_PASSWORD
            EmailTemplate forgotPasswordTemplate = new EmailTemplate();
            forgotPasswordTemplate.setTemplateCode("FORGOT_PASSWORD");
            forgotPasswordTemplate.setTemplateType(EmailTemplateType.TRANSACTIONAL);
            forgotPasswordTemplate.setName("Đặt lại mật khẩu");
            forgotPasswordTemplate.setSubject("Đặt lại mật khẩu - Oriental Herbs");
            forgotPasswordTemplate.setBodyHtml("""

                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2d5016;">Xin chào {{fullName}},</h2>
                    <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>Oriental Herbs</strong>.</p>
                    <p>Mã xác minh (OTP) của bạn là:</p>
                    <p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #2d5016; text-align: center; background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">{{otpCode}}</p>
                    <p>Mã có hiệu lực trong <strong>{{expiresIn}}</strong>.</p>
                    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">Trân trọng,<br>Đội ngũ Oriental Herbs</p>
                </div>

                """);
            repository.save(forgotPasswordTemplate);

            // 6. DELIVERY_SUCCESS
            EmailTemplate deliverySuccessTemplate = new EmailTemplate();
            deliverySuccessTemplate.setTemplateCode("DELIVERY_SUCCESS");
            deliverySuccessTemplate.setTemplateType(EmailTemplateType.TRANSACTIONAL);
            deliverySuccessTemplate.setName("Giao hàng thành công");
            deliverySuccessTemplate.setSubject("Giao hàng thành công đơn hàng #{{orderId}} - Oriental Herbs");
            deliverySuccessTemplate.setBodyHtml("""

                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2d5016;">Xin chào {{fullName}},</h2>
                    <p>Đơn hàng <strong>#{{orderId}}</strong> của bạn tại <strong>Oriental Herbs</strong> đã được giao thành công!</p>
                    <p>Cảm ơn bạn đã tin tưởng và mua sắm tại cửa hàng của chúng tôi.</p>
                    <p>Nếu bạn hài lòng với sản phẩm, hãy dành chút thời gian đánh giá sản phẩm nhé. Nếu có bất kỳ vấn đề gì, vui lòng liên hệ với chúng tôi để được hỗ trợ nhanh nhất.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">Trân trọng,<br>Đội ngũ Oriental Herbs</p>
                </div>

                """);
            repository.save(deliverySuccessTemplate);

            // 7. CHANGE_EMAIL_OTP
            EmailTemplate changeEmailTemplate = new EmailTemplate();
            changeEmailTemplate.setTemplateCode("CHANGE_EMAIL_OTP");
            changeEmailTemplate.setTemplateType(EmailTemplateType.TRANSACTIONAL);
            changeEmailTemplate.setName("Xác thực đổi Email");
            changeEmailTemplate.setSubject("Mã xác minh (OTP) đổi email - Oriental Herbs");
            changeEmailTemplate.setBodyHtml("""

                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2d5016;">Xin chào {{fullName}},</h2>
                    <p>Bạn đã yêu cầu thay đổi email trên hệ thống <strong>Oriental Herbs</strong> sang email này.</p>
                    <p>Mã xác minh (OTP) của bạn là:</p>
                    <p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #2d5016; text-align: center; background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">{{otpCode}}</p>
                    <p>Mã có hiệu lực trong <strong>{{expiresIn}}</strong>.</p>
                    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">Trân trọng,<br>Đội ngũ Oriental Herbs</p>
                </div>

                """);
            repository.save(changeEmailTemplate);

            System.out.println("Seeded Email Templates completed.");
        }
    }
}
