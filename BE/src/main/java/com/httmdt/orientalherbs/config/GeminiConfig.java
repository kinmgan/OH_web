package com.httmdt.orientalherbs.config;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.FunctionDeclaration;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.Part;
import com.google.genai.types.Schema;
import com.google.genai.types.Tool;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
public class GeminiConfig {

    @Value("${gemini.model}")
    private String model;

    private static final String SYSTEM_INSTRUCTION = """
            Bạn là "Đông Y AI" — trợ lý tư vấn sản phẩm của cửa hàng Oriental Herbs,
            chuyên về các sản phẩm Đông Y (thuốc Đông Y, thảo dược, thực phẩm chức năng).

            ## QUY TẮC BẮT BUỘC:
            1. BẠN KHÔNG PHẢI BÁC SĨ. Tuyệt đối KHÔNG chẩn đoán bệnh, KHÔNG kê đơn thuốc.
            2. Khi người dùng mô tả triệu chứng nghiêm trọng (đau ngực, khó thở, chảy máu,
               sốt cao, co giật...), PHẢI khuyên họ đến cơ sở y tế ngay lập tức.
            3. Chỉ được đề xuất sản phẩm CÓ TRONG HỆ THỐNG bằng cách gọi tool get_products.
               KHÔNG BAO GIỜ tự bịa tên sản phẩm.
            4. Khi đề xuất sản phẩm, LUÔN kèm link dạng: [Tên sản phẩm](/san-pham/{productId})
            5. LUÔN nhắc: "Quý khách nên tham khảo ý kiến bác sĩ/dược sĩ trước khi sử dụng."
            6. Trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa 200 từ mỗi câu trả lời).
            7. Nếu câu hỏi KHÔNG liên quan đến sức khỏe hoặc sản phẩm, lịch sự từ chối
               và hướng dẫn lại chủ đề.
            8. KHÔNG trả lời câu hỏi về giá cả nếu chưa gọi tool để kiểm tra giá thực tế.

            ## TRÍCH XUẤT HEALTH TAG (TỰ ĐỘNG, NGẦM):
            - Khi người dùng mô tả triệu chứng sức khỏe (đau đầu, mất ngủ, đau dạ dày, táo bón...),
              PHẢI gọi tool save_user_health_tags ngay lập tức và NGẦM (không thông báo cho user).
            - Kết quả tool KHÔNG hiển thị cho user, chỉ dùng nội bộ.
            - status: ACTIVE (đang có triệu chứng), RESOLVED (đã khỏi), CHRONIC (mãn tính), UNKNOWN (không rõ).
            - confidenceScore: 0.0 - 1.0 (AI tự đánh giá độ chắc chắn).
            - category: BẮT BUỘC phải phân loại triệu chứng vào MỘT trong các giá trị sau:
              * HO_HAP (Hệ Hô hấp: ho, sổ mũi, viêm họng, hen, xoang, khó thở, viêm phế quản...)
              * TIEU_HOA (Hệ Tiêu hóa: đau dạ dày, táo bón, tiêu chảy, đầy hơi, ợ nóng, viêm đại tràng...)
              * THAN_KINH (Hệ Thần kinh: đau đầu, mất ngủ, stress, lo âu, trầm cảm, chóng mặt, đau nửa đầu...)
              * CO_XUONG_KHOP (Hệ Cơ xương khớp: đau lưng, đau khớp, viêm khớp, thoái hóa, đau cổ, tê bì chân tay...)
              * TIM_MACH (Hệ Tim mạch: huyết áp cao/thấp, tim đập nhanh, mỡ máu, xơ vữa động mạch...)
              * DA_LIEU (Hệ Da liễu: mụn, eczema, viêm da, nổi mẩn, ngứa, herpes...)
              * KHAC (Các vấn đề khác: thận, gan, tiểu đường, tuyến giáp, mắt, tai, miễn dịch...)

            ## CÁCH SỬ DỤNG TOOLS:
            - Khi cần tìm sản phẩm phù hợp → gọi get_products với keyword phù hợp
            - Khi cần xem chi tiết 1 sản phẩm cụ thể → gọi get_product_detail với productId
            - Khi phát hiện triệu chứng sức khỏe từ lời nói của user → gọi save_user_health_tags
            - Ưu tiên gọi get_products trước để tìm, rồi get_product_detail nếu cần chi tiết
            """;

    @Bean
    public String geminiModelName() {
        return model;
    }

    @Bean
    public GenerateContentConfig geminiGenerationConfig() {
        return GenerateContentConfig.builder()
            .temperature(0.8f)
            .topP(0.95f)
            .topK(40f)
            .maxOutputTokens(8192)
            .systemInstruction(Content.fromParts(Part.fromText(SYSTEM_INSTRUCTION)))
            .tools(Tool.builder()
                .functionDeclarations(List.of(
                    getProductsDeclaration(),
                    getProductDetailDeclaration(),
                    getSaveUserHealthTagsDeclaration()
                ))
                .build())
            .build();
    }

    private FunctionDeclaration getProductsDeclaration() {
        return FunctionDeclaration.builder()
            .name("get_products")
            .description("Tìm kiếm sản phẩm theo từ khóa. Trả về tối đa 5 sản phẩm gồm: id, name, price, imageUrl, soldQuantity, rating")
            .parameters(
                Schema.builder()
                    .type(com.google.genai.types.Type.Known.OBJECT)
                    .properties(Map.of(
                        "keyword", Schema.builder()
                            .type(com.google.genai.types.Type.Known.STRING)
                            .description("Từ khóa tìm kiếm RẤT NGẮN GỌN (1-2 từ, VD: 'nóng', 'tiêu', 'ngủ', 'đau đầu')")
                            .build()
                    ))
                    .required(List.of("keyword"))
                    .build()
            )
            .build();
    }

    private FunctionDeclaration getProductDetailDeclaration() {
        return FunctionDeclaration.builder()
            .name("get_product_detail")
            .description("Lấy chi tiết sản phẩm: mô tả, thành phần, công dụng, variants, giá, tồn kho")
            .parameters(
                Schema.builder()
                    .type(com.google.genai.types.Type.Known.OBJECT)
                    .properties(Map.of(
                        "productId", Schema.builder()
                            .type(com.google.genai.types.Type.Known.INTEGER)
                            .description("ID của sản phẩm cần xem chi tiết")
                            .build()
                    ))
                    .required(List.of("productId"))
                    .build()
            )
            .build();
    }

    private FunctionDeclaration getSaveUserHealthTagsDeclaration() {
        return FunctionDeclaration.builder()
            .name("save_user_health_tags")
            .description("Lưu thông tin triệu chứng sức khỏe của user vào hệ thống. Đây là tool tự động, không hiển thị cho user.")
            .parameters(
                Schema.builder()
                    .type(com.google.genai.types.Type.Known.OBJECT)
                    .properties(Map.of(
                        "tagName", Schema.builder()
                            .type(com.google.genai.types.Type.Known.STRING)
                            .description("Tên triệu chứng/bệnh (VD: 'đau dạ dày', 'mất ngủ', 'đau đầu')")
                            .build(),
                        "status", Schema.builder()
                            .type(com.google.genai.types.Type.Known.STRING)
                            .description("Tình trạng: ACTIVE (đang có), RESOLVED (đã khỏi), CHRONIC (mãn tính), UNKNOWN (không rõ)")
                            .build(),
                        "category", Schema.builder()
                            .type(com.google.genai.types.Type.Known.STRING)
                            .description("Nhóm bệnh lý: HO_HAP, TIEU_HOA, THAN_KINH, CO_XUONG_KHOP, TIM_MACH, DA_LIEU, KHAC")
                            .build(),
                        "notes", Schema.builder()
                            .type(com.google.genai.types.Type.Known.STRING)
                            .description("Ghi chú thêm về triệu chứng (tùy chọn)")
                            .build(),
                        "confidenceScore", Schema.builder()
                            .type(com.google.genai.types.Type.Known.NUMBER)
                            .description("Độ chắc chắn của AI về triệu chứng này (0.0 - 1.0)")
                            .build()
                    ))
                    .required(List.of("tagName", "status", "category"))
                    .build()
            )
            .build();
    }
}
