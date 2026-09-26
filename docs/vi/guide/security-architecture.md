# Kiến trúc Bảo mật & Mã hóa

Simple OTP được xây dựng dựa trên nguyên lý **Zero-Trust và Ngoại tuyến hoàn toàn (Zero-Network)**. Khóa bí mật của bạn không bao giờ rời khỏi thiết bị vật lý và không bao giờ xuất hiện dưới dạng văn bản thô (plaintext) cho các tiến trình chưa được xác thực.

## Mô hình An toàn & Nguyên tắc Thiết kế

1. **Không kết nối mạng (Zero-Network)**: Ứng dụng không yêu cầu quyền Internet và tích hợp rào cản thời gian thực ngăn chặn mọi yêu cầu mạng HTTP/WebSocket.
2. **Két bảo mật phần cứng**: Khóa mã hóa chính được lưu trữ trong môi trường bảo mật phần cứng cách ly (iOS Keychain và Android Keystore qua `expo-secure-store`).
3. **Mã hóa xác thực (Authenticated Encryption)**: Toàn bộ dữ liệu tài khoản và tệp sao lưu được mã hóa bằng chuẩn **AES-256-GCM**, đảm bảo cả tính bảo mật lẫn tính toàn vẹn dữ liệu.
4. **Phòng chống lộ lọt màn hình**: Ngăn chặn chụp ảnh màn hình và che phủ giao diện khi chuyển đổi ứng dụng trong hệ điều hành.

---

## Chi tiết Thuật toán Mật mã học

### 1. Khóa két chính & Lưu trữ cục bộ

- **Master Vault Key (MVK)**: Khóa ngẫu nhiên 256-bit được sinh qua bộ tạo số giả ngẫu nhiên an toàn (CSPRNG) khi khởi tạo ứng dụng và lưu trong SecureStore phần cứng.
- **Mã hóa cơ sở dữ liệu**: Dữ liệu tài khoản được mã hóa bằng `AES-256-GCM` với Vector khởi tạo (IV) 12-byte duy nhất cho mỗi lần ghi.
- **Thẻ xác thực (Authentication Tag)**: Thẻ xác thực 128-bit đảm bảo phát hiện ngay lập tức bất kỳ sự giả mạo hay sai lệch dữ liệu nào trước khi tiến hành giải mã.

### 2. Định dạng Tệp Sao lưu Mã hóa (`.simpleotp`)

Khi xuất tệp sao lưu, Simple OTP sử dụng quy trình:

```
Mật khẩu của bạn + Muối ngẫu nhiên 16 byte
                    │
                    ▼
     PBKDF2 (HMAC-SHA-256, 100.000 vòng)
                    │
                    ▼
             Khóa dẫn xuất 256-bit
                    │
                    ▼
       Mã hóa xác thực AES-256-GCM
```

- **Salt (Muối)**: 16 byte ngẫu nhiên an toàn mật mã sinh mới cho mỗi tệp sao lưu.
- **Hàm dẫn xuất khóa (KDF)**: PBKDF2 với HMAC-SHA-256 và **100.000 vòng lặp**, kháng lại các cuộc tấn công bẻ khóa vét cạn (brute-force) hoặc từ điển.
- **Gói dữ liệu**: Toàn bộ danh sách tài khoản được đóng gói JSON và mã hóa AES-256-GCM với IV 12-byte cùng Auth Tag 16-byte.

### 3. Tiêu chuẩn Thuật toán OTP

- **TOTP (RFC 6238)**: Tính toán mã dựa trên bước thời gian 30 giây (mặc định), hỗ trợ các hàm băm **HMAC-SHA-1**, **HMAC-SHA-256**, và **HMAC-SHA-512**.
- **HOTP (RFC 4226)**: Tính toán mã dựa trên bộ đếm 8-byte big-endian và trích xuất số nguyên 31-bit (Dynamic Truncation).
- **Chuẩn hóa Base32**: Tuân thủ nghiêm ngặt RFC 4648, tự động loại bỏ khoảng trắng, dấu gạch nối và kiểm tra các bit dư thừa an toàn.

---

## Cơ chế Bảo vệ Giao diện

### Chống Chụp và Quay Màn hình

- **Android**: Kích hoạt cờ native `FLAG_SECURE`, chặn hoàn toàn tính năng chụp màn hình, quay video màn hình và hiển thị bản xem trước trong trình quản lý tác vụ gần đây.
- **iOS**: Tự động hiển thị lớp phủ mờ bảo vệ ngay khi trạng thái ứng dụng rời khỏi vùng hiển thị (`AppState !== 'active'`), ngăn ngừa lộ lọt mã OTP trong giao diện chuyển đổi ứng dụng của iOS.
