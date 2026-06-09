# Hệ Thống Thương Mại Điện Tử (E-Commerce System)

Chào mừng bạn đến với dự án hệ thống thương mại điện tử! Đây là một dự án bao gồm các tính năng từ phía người dùng mua sắm (User) đến trang quản trị (Admin Dashboard) phù hợp với nghiệp vụ đặc thù của ngành Đông Y.

---

## 🚀 Các Nghiệp Vụ Chính (Core Business)
Hệ thống xoay quanh việc quản lý và vận hành một cửa hàng trực tuyến với quy trình khép kín:

- **Quản lý Sản phẩm & Danh mục**: Hiển thị, phân loại, tìm kiếm sản phẩm với nhiều biến thể (variants).
- **Giỏ hàng & Đặt hàng**: Quản lý giỏ hàng, tính toán phí vận chuyển (Shipping Estimation) và quy trình checkout.
- **Thanh toán (Payment)**: Tích hợp cổng thanh toán để xử lý giao dịch.
- **Quản lý Đơn hàng (Order Management)**: Xử lý trạng thái đơn, theo dõi giao hàng.
- **Xử lý Hoàn/Trả hàng (Return Orders)**: Quy trình yêu cầu và phê duyệt đổi trả hàng.
- **Quản lý Khách hàng**: Đăng ký, đăng nhập, hồ sơ người dùng, quản lý sổ địa chỉ.
- **Đánh giá Sản phẩm (Reviews)**: Khách hàng để lại đánh giá, rating cho sản phẩm đã mua.

---

## ✨ Những Tính Năng Nổi Bật
1. **AI Chatbot Tư Vấn**: 
   - Ứng dụng **Google GenAI** tích hợp vào hệ thống để tự động hỗ trợ khách hàng, giải đáp thắc mắc và tư vấn sản phẩm thông minh.
2. **Dynamic Homepage (Trang chủ Động)**: 
   - Admin có khả năng kéo thả, cấu hình và thay đổi bố cục, nội dung trang chủ (Homepage Sections) trực tiếp từ Dashboard mà không cần can thiệp vào code.
3. **Hệ Thống Chiến Dịch Marketing & Coupon**: 
   - Triển khai các chiến dịch giảm giá (Campaign Pricing), mã khuyến mãi giúp đẩy mạnh doanh số.
4. **Phân Tích Khách Hàng (User Radar Chart)**: 
   - Cung cấp cái nhìn trực quan về tình hình sức khỏe của khách hàng thông qua biểu đồ Radar trong admin.
5. **Xác Thực Đa Nền Tảng**: 
   - Tích hợp **OAuth2** (Google Login) cùng JWT Tokens giúp quá trình đăng nhập diễn ra mượt mà và cực kỳ bảo mật.
6. **Lưu Trữ Ảnh Đám Mây (Cloudinary)**: 
   - Tự động upload, tối ưu hóa và lưu trữ hình ảnh sản phẩm qua dịch vụ Cloudinary.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

### Backend (`/BE`)
- **Ngôn ngữ**: Java 17
- **Framework**: Spring Boot (với Spring Data JPA, Spring Security, Spring Web)
- **Database**: PostgreSQL
- **Bảo mật**: JWT (JSON Web Tokens), OAuth2 Client
- **Tool/Dịch vụ**: Cloudinary (Image Hosting), JavaMail (Gửi email), Google GenAI, Gradle.

### Frontend User (`/fe`)
- **Framework**: Next.js (App Router)
- **Ngôn ngữ**: TypeScript
- **Styling**: Tailwind CSS (hoặc CSS/PostCSS)
- **Kiến trúc**: Phân chia rõ ràng Components, Hooks, Services (gọi API HTTP), Types.

### Frontend Admin (`/fe-admin`)
- **Framework**: Next.js (App Router)
- **Ngôn ngữ**: TypeScript
- **Đặc điểm**: Tối ưu UI/UX cho quản trị viên với các module quản lý: Đơn hàng, Khách hàng, Sản phẩm, Chiến dịch, Giao diện,...

## 🐳 Chạy Dự Án Bằng Docker

Chỉ cần **Docker Desktop**.

### Yêu cầu
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã được cài đặt và đang chạy.

### Bước 1: Cấu hình biến môi trường

Đảm bảo các file `.env` đã tồn tại và được cấu hình đúng:

| Service | File | Mô tả |
|---------|------|-------|
| Backend | `BE/.env` | Cấu hình DB, JWT, Cloudinary, Payment, Gemini AI,... (copy từ `BE/.env.example`) |
| Frontend User | `fe/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1` |
| Frontend Admin | `fe-admin/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1` |


### Bước 2: Build và khởi chạy

Mở terminal tại thư mục gốc của dự án và chạy:

```bash
docker-compose up --build -d
```

Quá trình build lần đầu sẽ mất vài phút. Sau khi hoàn tất, các service sẽ chạy tại:

| Service | URL | Mô tả |
|---------|-----|-------|
| Backend (Spring Boot) | `http://localhost:8080` | REST API (`/api/v1/...`) |
| Frontend User (Next.js) | `http://localhost:3000` | Trang mua sắm cho khách hàng |
| Frontend Admin (Next.js) | `http://localhost:3001` | Trang quản trị cho Admin |

### Các lệnh Docker hữu ích

```bash
# Xem logs của tất cả service
docker-compose logs -f

# Xem logs của một service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f frontend-admin

# Dừng tất cả service
docker-compose down

# Build lại một service cụ thể (VD: sau khi sửa code backend)
docker-compose up --build -d backend

# Xem trạng thái các container
docker-compose ps
```

---

## ⚙️ Hướng Dẫn Cài Đặt & Chạy Dự Án (Local Development)

Để chạy được dự án, hãy đảm bảo máy bạn đã cài đặt: **Java 17**, **Node.js (>= 18)**, và **PostgreSQL**.

### 1. Khởi chạy Backend (`/BE`)
1. Cài đặt và khởi chạy **PostgreSQL**. Tạo một database mới cho dự án.
2. Mở terminal, di chuyển vào thư mục BE:
   ```bash
   cd BE
   ```
3. Tạo file `.env` từ file mẫu `.env.example` và cấu hình thông tin kết nối DB, JWT Secret, Cloudinary, Google GenAI,...:
   ```bash
   cp .env.example .env
   ```
4. Khởi chạy project bằng Gradle:
   - Trên Windows:
     ```cmd
     gradlew.bat bootRun
     ```
   - Trên Mac/Linux:
     ```bash
     ./gradlew bootRun
     ```
   *(Backend sẽ chạy ở cổng mặc định thường là `8080`)*

### 2. Khởi chạy Frontend User (`/fe`)
1. Mở một terminal mới, di chuyển vào thư mục Frontend:
   ```bash
   cd fe
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy server development:
   ```bash
   npm run dev
   ```
   *(Truy cập trình duyệt tại: `http://localhost:3000`)*

### 3. Khởi chạy Frontend Admin (`/fe-admin`)
1. Mở một terminal mới, di chuyển vào thư mục Admin:
   ```bash
   cd fe-admin
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy server development:
   ```bash
   npm run dev
   ```
   *(Truy cập trình duyệt tại URL admin, thường là: `http://localhost:3001` hoặc cổng được Next.js cấp phát)*



