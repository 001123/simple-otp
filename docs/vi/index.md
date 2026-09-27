---
layout: home

hero:
  name: "Simple OTP"
  text: "Xác thực 2FA Ngoại Tuyến 100% & Siêu Bảo Mật"
  tagline: "Bảo vệ mã xác thực 2 lớp bằng mã hóa phần cứng an toàn tuyệt đối, đồng hành cùng các trợ thủ ảo tương tác sống động."
  image:
    src: /icon.png
    alt: Simple OTP Logo
  actions:
    - theme: brand
      text: Bắt đầu ngay
      link: /vi/guide/getting-started
    - theme: alt
      text: Kiến trúc bảo mật
      link: /vi/guide/security-architecture
    - theme: alt
      text: Mã nguồn GitHub
      link: https://github.com/kd-labs-io/simple-otp

features:
  - icon: 🛡️
    title: Ngoại Tuyến 100% & Không Mạng
    details: Hoàn toàn không cấp quyền Internet, không máy chủ ngoài, không theo dõi hay thu thập bất kỳ dữ liệu nào. Khóa bí mật chỉ lưu trên máy bạn.
  - icon: 🔐
    title: Két mã hóa phần cứng
    details: Khóa chính MVK sinh qua PBKDF2 (100.000 vòng) và lưu trữ trong iOS Keychain / Android Keystore với mã hóa xác thực AES-256-GCM.
  - icon: ⚡
    title: Chuẩn RFC 6238 & 4226
    details: Hỗ trợ đầy đủ mã theo thời gian (TOTP) và theo bộ đếm (HOTP), tương thích các thuật toán SHA-1, SHA-256 và SHA-512.
  - icon: 📷
    title: Nhập mã đa kênh
    details: Quét mã QR trực tiếp bằng camera, đọc ảnh QR từ thư viện, tự động nhận diện liên kết otpauth:// từ bộ nhớ tạm (clipboard) hoặc nhập tay.
  - icon: 🐱
    title: Trợ thủ ảo tương tác
    details: Hoạt ảnh Reanimated mượt mà với 3 linh vật (Cipher Cat, Byte Dog, Shield Bunny) tự động phản ứng và trò chuyện theo từng thao tác.
  - icon: 📦
    title: Sao lưu mã hóa an toàn
    details: Xuất và phục hồi danh sách tài khoản dưới định dạng tệp .simpleotp được mã hóa mật khẩu bảo vệ toàn vẹn dữ liệu.
---
