# fe-admin

Admin Dashboard cho Oriental Herbs - Quản lý dược liệu Đông Y

## Tính năng

- 📊 **Tổng quan**: Dashboard với thống kê chính
- 📦 **Đơn hàng**: Quản lý, xem chi tiết, xử lý đơn hàng
- 🏷️ **Danh mục**: Thêm, sửa, xóa danh mục sản phẩm
- 🛍️ **Sản phẩm**: Quản lý sản phẩm, giá, kho
- 👥 **Khách hàng**: Xem thông tin, quản lý khách hàng
- 🎉 **Khuyến mãi**: Tạo chiến dịch khuyến mãi
- 🎨 **Giao diện Web**: Cài đặt cơ bản website

## Cấu trúc dự án

```
fe-admin/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── orders/
│   │   ├── categories/
│   │   ├── products/
│   │   ├── customers/
│   │   ├── promotions/
│   │   └── appearance/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── common/
│   ├── services/
│   ├── types/
│   ├── hooks/
│   └── utils/
└── public/
    └── icon/
```

## Công nghệ sử dụng

- **Next.js 16**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

## Cài đặt

```bash
npm install
```

## Chạy dự án

```bash
npm run dev
```

Admin dashboard sẽ chạy tại: `http://localhost:3001`

## Build

```bash
npm run build
npm start
```

## Thiết kế

- **Màu chính**: #A57322 (Brown/Thương hiệu)
- **Màu nền**: #FCF8F1 (Cream/Sáng)
- **Font**: Be Vietnam Pro (Heading), Cormorant Garamond (Serif)

## Cần hoàn thiện

- [ ] Integration với backend API
- [ ] Authentication & Authorization
- [ ] Real-time data updates
- [ ] More detailed modals/forms
- [ ] Export functionality
- [ ] Advanced filtering & search
- [ ] Analytics & reports
- [ ] Mobile responsive optimization
