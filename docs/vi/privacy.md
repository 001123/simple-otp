# Chính sách Quyền riêng tư

**Cập nhật lần cuối**: Tháng 09/2026

Simple OTP được phát triển với cam kết cao nhất về việc tôn trọng và bảo vệ tuyệt đối quyền riêng tư của bạn. Chính sách này nêu rõ cách chúng tôi xử lý dữ liệu.

## 1. Không Thu thập Bất kỳ Dữ liệu nào

- **Không thông tin cá nhân**: Simple OTP không thu thập họ tên, email, số điện thoại, địa chỉ IP, định danh thiết bị hay vị trí của bạn.
- **Không theo dõi hay đo lường (Telemetry)**: Ứng dụng không sử dụng Firebase, Google Analytics, Sentry hay bất kỳ SDK phân tích/báo lỗi của bên thứ ba nào.
- **Không quảng cáo**: Hoàn toàn không chứa quảng cáo, pixel theo dõi hoặc mã tiếp thị.

## 2. Hoạt động Ngoại tuyến 100%

- **Kiến trúc Không-Mạng (Zero-Network)**: Ứng dụng chạy hoàn toàn offline trên máy bạn và không thiết lập bất kỳ kết nối mạng nào ra ngoài.
- **Lưu trữ Cục bộ có Bảo vệ Phần cứng**: Toàn bộ mã bí mật 2FA, tên tài khoản và nhãn dịch vụ đều được mã hóa và lưu trữ duy nhất trong két bảo mật phần cứng của máy (`Keychain` trên iOS, `Keystore` trên Android).

## 3. Quyền Truy cập Thiết bị

Simple OTP chỉ yêu cầu số lượng quyền tối thiểu tuyệt đối để thực hiện chức năng:

- **Máy ảnh (Camera)**: Chỉ dùng duy nhất để quét mã QR 2FA trực tiếp. Luồng hình ảnh được xử lý tức thời và không bao giờ lưu trữ hay tải lên. Quyền ghi âm/microphone đã bị vô hiệu hóa hoàn toàn.
- **Thư viện ảnh**: Chỉ kích hoạt khi bạn chủ động bấm chọn ảnh mã QR từ album ảnh.
- **Sinh trắc học (Face ID / Vân tay)**: Được xử lý trực tiếp bởi hệ điều hành thông qua khung `LocalAuthentication`. Ứng dụng không bao giờ có quyền truy cập vào dữ liệu sinh trắc học gốc của bạn.

## 4. Bản sao lưu Dữ liệu

Mọi tệp sao lưu do bạn tạo ra đều được bảo vệ bằng mật khẩu của chính bạn thông qua thuật toán **PBKDF2 (100.000 vòng lặp)** và mã hóa **AES-256-GCM**. Tệp `.simpleotp` chỉ được lưu ở nơi bạn chỉ định.

## 5. Minh bạch Mã nguồn Mở

Simple OTP là phần mềm tự do nguồn mở theo giấy phép MIT. Toàn bộ mã nguồn được công khai và cộng đồng có thể kiểm tra độc lập tại [GitHub](https://github.com/kd-labs-io/simple-otp).

## Liên hệ

Nếu bạn có bất kỳ câu hỏi nào về chính sách này, vui lòng gửi phản hồi trên [GitHub Repository](https://github.com/kd-labs-io/simple-otp).
