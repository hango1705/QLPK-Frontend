# Website Quản Lý Phòng Khám Nha Khoa

Đây là dự án frontend cho hệ thống quản lý phòng khám nha khoa, được xây dựng bằng ReactJS và Vite.

## Công nghệ sử dụng

- **Framework:** React 19.1.1
- **Ngôn ngữ:** TypeScript
- **Build Tool:** Vite
- **Định tuyến:** React Router DOM
- **Gọi API:** Axios & React Query
- **Quản lý trạng thái:** Redux Toolkit
- **Styling:** (Ghi thư viện bạn sẽ dùng, ví dụ: Tailwind CSS, Material-UI...)
- **Kiểm tra & Định dạng code:** ESLint, Prettier, Husky

## Chức năng chính

Tên đề tài: Xây dựng website quản lý phòng khám nha khoa sử dụng Spring Boot, ReactJs và MySQL (công nghệ cho backend), (database)
Nội dung chính của đồ án:
Đề tài tập trung xây dựng một ứng dụng website quản lý phòng khám nha khoa tư nhân, nhằm hỗ trợ bác sĩ, y tá và bệnh nhân kết nối với các chức năng:
KHÁCH (Guest):
Hiện thông tin quảng cáo trang web của phòng khám.
BỆNH NHÂN (PATIENT)
• Đăng ký và đăng nhập tài khoản: Bệnh nhân có thể tự đăng ký tài khoản mới, hệ thống tự động sinh mã bệnh nhân và gửi qua email, sau đó đăng nhập để sử dụng dịch vụ.
• Xem kết quả khám bệnh và điều trị: Bệnh nhân có thể xem chi tiết kết quả khám bệnh, chẩn đoán, ghi chú của bác sĩ và lịch sử điều trị.
• Xem kế hoạch điều trị: Bệnh nhân theo dõi kế hoạch điều trị được chia thành nhiều giai đoạn, xem phác đồ thuốc và tiến trình điều trị.
• Xem hình ảnh y tế: Bệnh nhân có thể xem các hình ảnh X-quang, CT scan, liên quan đến quá trình điều trị của mình.
• Thanh toán trực tuyến: Bệnh nhân xem hóa đơn chi tiết, thanh toán online qua VNPay và theo dõi lịch sử thanh toán.
BÁC SĨ (DOCTOR)
• Quản lý thông tin hành chính bệnh nhân: Bác sĩ có thể xem và quản lý thông tin cơ bản của các bệnh nhân được phân công.
• Thực hiện khám bệnh: Bác sĩ ghi nhận triệu chứng, chẩn đoán, thêm ghi chú ngắn và lưu kết quả khám vào hệ thống.
• Quản lý hình ảnh y tế: Bác sĩ upload và quản lý hình ảnh X-quang, CT scan, có thể xem và so sánh hình ảnh theo thời gian.
• Lập kế hoạch điều trị: Bác sĩ tạo kế hoạch điều trị chia thành nhiều giai đoạn, nhập phác đồ thuốc và theo dõi tiến trình điều trị.
• Tính toán và quản lý thanh toán: Bác sĩ ước tính chi phí điều trị, tạo hóa đơn chi tiết và tổng hợp thanh toán cho bệnh nhân.
Y TÁ (NURSE)
• Quản lý thông tin hành chính bệnh nhân: Y tá có thể xem và quản lý thông tin cơ bản của các bệnh nhân được phân công.
• Quản lý hình ảnh y tế: Y tá upload và quản lý hình ảnh X-quang, CT scan, có thể xem và so sánh hình ảnh theo thời gian.
• Xem hoạch điều trị.
• Lên hóa đơn, xem hóa đơn thanh toán của bệnh nhân.
QUẢN TRỊ VIÊN (ADMIN)
• Quản lý tài khoản người dùng: Quản trị viên có thể tạo, sửa, xóa (vô hiệu hóa) tài khoản của bác sĩ và bệnh nhân trong hệ thống.
• Quản lý phân quyền: Quản trị viên cấp quyền và kiểm soát truy cập của các người dùng khác trong hệ thống.

## Hướng dẫn cài đặt

1.  Clone repository:
    ```bash
    git clone [URL_CUA_REPOSITORY]
    ```
2.  Di chuyển vào thư mục dự án:
    ```bash
    cd dental-clinic-frontend
    ```
3.  Cài đặt các gói phụ thuộc:
    ```bash
    npm install
    ```
4.  Tạo file `.env` ở thư mục gốc và cấu hình biến môi trường:
    ```
    VITE_API_BASE_URL=http://localhost:8080/api
    ```
5.  Chạy dự án ở môi trường development:
    ```bash
    npm run dev
    ```

## Các câu lệnh hữu ích

- `npm run dev`: Chạy dự án ở chế độ development.
- `npm run build`: Build dự án cho môi trường production.
- `npm run lint`: Kiểm tra lỗi code.
- `npm run format`: Tự động định dạng code.
