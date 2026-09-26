# Sao lưu & Phục hồi

Vì Simple OTP hoạt động **ngoại tuyến 100%**, ứng dụng không tự động đồng bộ lên máy chủ đám mây. Để phòng ngừa rủi ro mất hoặc hỏng thiết bị, bạn nên chủ động tạo bản sao lưu định kỳ.

## Định dạng Tệp `.simpleotp`

Simple OTP lưu trữ tệp sao lưu dưới phần mở rộng `.simpleotp`. Cấu trúc bao gồm:
- `version`: Phiên bản cấu trúc tệp (hiện tại là `2`).
- `salt`: Chuỗi Hex của 16 byte muối ngẫu nhiên cho thuật toán PBKDF2.
- `iv`: Chuỗi Hex của 12 byte Vector khởi tạo.
- `tag`: Chuỗi Hex của 16 byte thẻ xác thực tính toàn vẹn AES-GCM.
- `data`: Bản mã Hex chứa toàn bộ danh sách tài khoản 2FA.

---

## Hướng dẫn Xuất Bản sao lưu

1. Mở **Simple OTP** và bấm vào biểu tượng **Cài đặt** (Settings).
2. Chọn **Xuất bản sao lưu mã hóa** (Export Encrypted Backup).
3. Nhập mật khẩu bảo vệ mạnh và xác nhận lại mật khẩu.
4. Bấm **Xuất tệp**. Hộp thoại chia sẻ của hệ điều hành sẽ xuất hiện để bạn:
   - Lưu vào ứng dụng Tệp (iCloud Drive / Bộ nhớ trong máy).
   - Gửi AirDrop sang máy tính hoặc thiết bị phụ đáng tin cậy.
   - Lưu trữ trên Google Drive / Nextcloud cá nhân.

> [!IMPORTANT]
> Simple OTP hoàn toàn không thể khôi phục bản sao lưu nếu bạn quên mật khẩu. Không có máy chủ phục hồi hay bất kỳ cửa sau (backdoor) nào.

---

## Hướng dẫn Phục hồi từ Bản sao lưu

1. Trên thiết bị mới hoặc sau khi cài lại máy, mở **Simple OTP**.
2. Vào **Cài đặt** -> chọn **Nhập bản sao lưu** (Import Backup).
3. Chọn tệp `.simpleotp` của bạn thông qua trình duyệt tệp hệ thống.
4. Nhập mật khẩu đã đặt khi xuất tệp.
5. Bấm **Phục hồi** (Restore).

Ứng dụng sẽ tiến hành giải mã, kiểm tra thẻ toàn vẹn mật mã học và nhập danh sách tài khoản vào két an toàn của máy bạn.
