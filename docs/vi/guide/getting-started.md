# Bắt đầu sử dụng

Chào mừng bạn đến với **Simple OTP**, ứng dụng xác thực 2 bước (2FA) mã nguồn mở, hoạt động hoàn toàn ngoại tuyến, ưu tiên tính riêng tư và bảo mật tuyệt đối.

## Điểm nổi bật

- **Ngoại tuyến 100%**: Không kết nối mạng, không đồng bộ đám mây, không lưu vết hay phân tích người dùng.
- **Bảo mật sinh trắc học**: Mở khóa an toàn bằng Face ID, vân tay hoặc mã PIN của thiết bị.
- **Tấm chắn bảo mật (Privacy Shield)**: Chống chụp màn hình và tự động che giấu thông tin nhạy cảm khi chuyển đổi ứng dụng (`FLAG_SECURE` trên Android và lớp phủ bảo mật trên iOS).
- **Trợ thủ ảo đồng hành**: Tùy chọn linh vật **Cipher Cat**, **Byte Dog**, hoặc **Shield Bunny** để hỗ trợ và hướng dẫn bạn trong quá trình xác thực.

## Cài đặt & Yêu cầu hệ thống

- **iOS**: iOS 15.1 trở lên.
- **Android**: Android 9.0 (API 28) trở lên.

## Thêm tài khoản 2FA đầu tiên

Bạn có thể thêm tài khoản bằng 4 phương thức linh hoạt:

1. **Quét mã QR qua Camera**:
   - Chạm vào nút `+` nổi ở góc dưới màn hình chính.
   - Chọn **Quét mã QR** và hướng camera vào mã QR cài đặt 2FA từ dịch vụ của bạn (Google, GitHub, Facebook, AWS,...).

2. **Quét mã QR từ thư viện ảnh**:
   - Lưu hoặc chụp ảnh màn hình mã QR 2FA vào bộ sưu tập.
   - Chọn `+` -> **Chọn ảnh từ thư viện**. Ứng dụng sẽ tự động trích xuất và giải mã hoàn toàn trên thiết bị.

3. **Tự động nhận diện từ bộ nhớ tạm (Clipboard)**:
   - Sao chép đường dẫn chuẩn `otpauth://totp/...` hoặc `otpauth://hotp/...`.
   - Mở Simple OTP, ứng dụng sẽ phát hiện và hiển thị hộp thoại để thêm tài khoản chỉ với 1 chạm.

4. **Nhập thủ công**:
   - Nếu không có mã QR, chọn **Nhập thủ công**.
   - Điền Tên dịch vụ (Issuer), Tên tài khoản và Khóa bí mật (Base32). Ứng dụng sẽ tự động chuẩn hóa khoảng trắng và dấu gạch ngang.

## Thao tác với mã OTP

- **Sao chép mã**: Chạm trực tiếp vào thẻ tài khoản để sao chép mã 6 hoặc 8 chữ số vào bộ nhớ tạm.
- **Tìm kiếm nhanh**: Sử dụng thanh tìm kiếm thời gian thực ở đầu màn hình để lọc danh sách theo tên dịch vụ hoặc tài khoản.
- **Cảnh báo hết hạn (<5s)**: Khi mã TOTP còn dưới 5 giây, vòng tròn đếm ngược sẽ chuyển sang màu đỏ cảnh báo trước khi đổi mã mới.
- **Tăng bộ đếm HOTP**: Đối với mã HOTP theo sự kiện, bấm nút làm mới trên thẻ để tạo mã tiếp theo.
