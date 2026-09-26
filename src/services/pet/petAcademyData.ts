import type { AcademyLesson, LessonId } from '@/types/pet';

export const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: 'lesson-1',
    index: 1,
    title: 'Tại sao mật khẩu thông thường là chưa đủ?',
    subtitle:
      'Hiểu rõ nguy cơ rò rỉ dữ liệu, tấn công nhồi mật khẩu và lý do tại sao mật khẩu tĩnh không thể bảo vệ bạn mãi mãi.',
    badge: 'Cơ bản',
    mascotId: 'cipher-cat',
    mascotName: 'Mèo Cipher',
    mascotEmoji: '🐱',
    readingTime: '2 phút',
    introQuote: 'Meo! Bạn nghĩ mật khẩu dài 16 ký tự là an toàn tuyệt đối ư? Không hề đâu nhé!',
    summary:
      'Mật khẩu tĩnh lưu trên máy chủ luôn có nguy cơ bị rò rỉ. Tấn công nhồi thông tin đăng nhập khiến một lỗ hổng ở trang web nhỏ đe dọa toàn bộ tài khoản quan trọng của bạn.',
    sections: [
      {
        title: '1. Ảo tưởng về sự an toàn của mật khẩu tĩnh',
        content:
          'Mật khẩu là một chuỗi ký tự cố định được lưu trên máy chủ của dịch vụ. Ngay cả khi bạn đặt mật khẩu cực kỳ phức tạp, nếu máy chủ của nhà cung cấp dịch vụ bị xâm nhập (Data Breach), mật khẩu đã mã hoá (hash) của bạn có thể bị tin tặc giải mã bằng siêu máy tính hoặc rò rỉ dưới dạng văn bản thô.',
        callout: {
          type: 'warning',
          title: 'Con số giật mình',
          text: 'Hơn 15 tỷ thông tin đăng nhập đã bị rò rỉ trên Internet từ các vụ tấn công cơ sở dữ liệu lớn!',
          icon: '⚠️',
        },
      },
      {
        title: '2. Hiểm hoạ "Nhồi mật khẩu" (Credential Stuffing)',
        content:
          'Hầu hết người dùng có thói quen dùng chung một mật khẩu (hoặc biến thể tương tự) cho nhiều tài khoản như Facebook, Gmail, Ngân hàng, Diễn đàn. Khi một diễn đàn nhỏ bị lộ dữ liệu, hacker sẽ dùng bot tự động thử cặp Email/Mật khẩu đó trên hàng loạt dịch vụ quan trọng khác.',
        diagram: {
          type: 'credential-stuffing',
          caption: 'Quy trình tấn công nhồi mật khẩu',
          items: [
            { label: 'Bước 1', description: 'Diễn đàn game A bị rò rỉ dữ liệu tài khoản.' },
            { label: 'Bước 2', description: 'Hacker gom danh sách Email + Mật khẩu.' },
            { label: 'Bước 3', description: 'Botnet tự động thử đăng nhập vào Gmail, GitHub, Ngân hàng.' },
            { label: 'Bước 4', description: 'Nếu không có 2FA, hacker toàn quyền kiểm soát tài khoản!' },
          ],
        },
      },
      {
        title: '3. Yếu tố thứ hai (2FA) cứu nguy thế nào?',
        content:
          'Xác thực hai bước (2FA) bổ sung một lớp phòng thủ thứ hai độc lập hoàn toàn với mật khẩu. Kẻ tấn công dù nắm được mật khẩu tĩnh của bạn nhưng không sở hữu thiết bị vật lý chứa mã OTP thì vẫn bị chặn đứng ngay tại cổng đăng nhập.',
        callout: {
          type: 'tip',
          title: 'Lá chắn 2FA',
          text: 'Bật 2FA giúp ngăn chặn hơn 99% các vụ tấn công đánh cắp tài khoản tự động.',
          icon: '💡',
        },
      },
    ],
    proTip:
      'Đừng bao giờ tái sử dụng mật khẩu giữa các trang web. Nhưng điều quan trọng nhất: Hãy bật 2FA trên mọi tài khoản quan trọng ngay hôm nay meo!',
    takeaway:
      'Mật khẩu chỉ là "Thứ bạn biết". 2FA bổ sung "Thứ bạn có" (thiết bị sinh mã OTP) để vô hiệu hoá 99.9% các vụ tấn công đánh cắp mật khẩu.',
    quiz: {
      question: 'Tại sao hacker vẫn chiếm được tài khoản dù bạn đặt mật khẩu rất mạnh?',
      options: [
        { text: 'Vì mật khẩu mạnh dễ đoán hơn mật khẩu ngắn.', isCorrect: false },
        {
          text: 'Do máy chủ dịch vụ bị rò rỉ dữ liệu hoặc do thói quen dùng chung mật khẩu.',
          isCorrect: true,
        },
        { text: 'Vì điện thoại của bạn tự động gửi mật khẩu cho hacker.', isCorrect: false },
      ],
      explanation:
        'Dù mật khẩu mạnh đến đâu, nếu máy chủ của trang web bị xâm nhập hoặc bạn dùng chung mật khẩu ở trang web khác bị lộ, tin tặc vẫn có thể lấy được mật khẩu đó.',
    },
  },
  {
    id: 'lesson-2',
    index: 2,
    title: '2FA là gì & TOTP hoạt động ra sao?',
    subtitle:
      'Giải mã công thức toán học biến Khoá bí mật chung và Thời gian thực thành mã số 6 chữ số biến đổi tức thì.',
    badge: 'Nguyên lý',
    mascotId: 'byte-dog',
    mascotName: 'Chó Byte',
    mascotEmoji: '🐶',
    readingTime: '3 phút',
    introQuote:
      'Gâu gâu! Anh bạn có tò mò tại sao Simple OTP không cần mạng internet mà mã sinh ra vẫn trùng khớp với Google không?',
    summary:
      'TOTP kết hợp Bí mật chung và Thời gian Unix Epoch bằng hàm băm mật mã HMAC-SHA1 để sinh mã 6 số độc lập hoàn toàn với kết nối mạng.',
    sections: [
      {
        title: '1. Nguyên lý cốt lõi của 2FA',
        content:
          'Bảo mật hiện đại dựa trên sự kết hợp giữa 3 yếu tố: Thứ bạn biết (Mật khẩu), Thứ bạn có (Điện thoại/Token), và Thứ bạn là (Sinh trắc học). TOTP là hiện thân hoàn hảo của "Thứ bạn có".',
      },
      {
        title: '2. Bí mật chung (Shared Secret) - Hạt giống bất biến',
        content:
          'Khi bạn quét mã QR để thêm tài khoản, máy chủ và điện thoại của bạn cùng chia sẻ một chuỗi ký tự bí mật Base32 (ví dụ: JBSWY3DPEHPK3PXP). Chuỗi này được lưu an toàn trong phần cứng thiết bị và không bao giờ gửi qua internet nữa.',
      },
      {
        title: '3. Đồng hồ Unix (Unix Epoch) & Bước thời gian 30 giây',
        content:
          'Cả thế giới cùng chia sẻ một hệ quy chiếu thời gian chuẩn: số giây trôi qua tính từ ngày 01/01/1970 UTC. TOTP chia số giây này cho chu kỳ (thường là 30 giây): T = ⌊Thời gian hiện tại / 30⌋. Cứ sau 30 giây, số T tự động tăng thêm 1 trên cả điện thoại lẫn máy chủ.',
      },
      {
        title: '4. Quy trình tính toán TOTP (RFC 6238)',
        content:
          '1. Ghép Bí mật chung K và Bộ đếm thời gian T.\n2. Băm bằng thuật toán mật mã: HMAC-SHA1(K, T) tạo ra chuỗi 20 bytes.\n3. Cắt ngắn động (Dynamic Truncation): Lấy 4 bits cuối làm offset để trích xuất số nguyên 31-bit.\n4. Lấy phần dư với 10^6: Tạo ra đúng 6 chữ số hiển thị trên màn hình.',
        callout: {
          type: 'info',
          title: '100% Không Cần Mạng',
          text: 'Ứng dụng không cần gửi bất kỳ dữ liệu nào qua mạng vì cả máy chủ và điện thoại đều tự tính toán độc lập dựa trên cùng một công thức toán học!',
          icon: 'ℹ️',
        },
      },
    ],
    proTip:
      'Gâu gâu! Nếu mã OTP báo sai, hãy kiểm tra lại đồng hồ của điện thoại nhé! Giữ đồng hồ tự động theo giờ mạng (Network Time) là chìa khoá để mã luôn chính xác!',
    takeaway:
      'TOTP = Bí mật chung + Thời gian hiện tại. Không cần internet, không sợ nghe lén mạng, bảo mật toán học tuyệt đối.',
    quiz: {
      question:
        'Yếu tố nào giúp Simple OTP tạo mã trùng khớp với máy chủ dù hoàn toàn không kết nối mạng?',
      options: [
        { text: 'Nhờ sóng vô tuyến tầm ngắn Bluetooth với máy chủ.', isCorrect: false },
        {
          text: 'Cả hai bên cùng giữ bí mật chung và tính toán theo cùng thời gian thực Unix.',
          isCorrect: true,
        },
        { text: 'Điện thoại lưu trước danh sách 1 triệu mã ngẫu nhiên của cả năm.', isCorrect: false },
      ],
      explanation:
        'Bí mật chung (Shared Secret) và thời gian thực toàn cầu (Unix Epoch) được đưa vào cùng thuật toán HMAC-SHA1 giúp hai bên tạo ra cùng một kết quả mà không cần trao đổi dữ liệu.',
    },
  },
  {
    id: 'lesson-3',
    index: 3,
    title: 'TOTP khác HOTP thế nào?',
    subtitle:
      'Phân biệt cơ chế tự động đổi theo thời gian (TOTP) và tăng dần theo lượt bấm (HOTP) cùng cách ứng xử khi bị lệch bước đếm.',
    badge: 'So sánh',
    mascotId: 'cipher-cat',
    mascotName: 'Mèo Cipher',
    mascotEmoji: '🐱',
    readingTime: '2.5 phút',
    introQuote:
      'Meo! Bạn có thấy một số thẻ trong Simple OTP có nút "Lấy mã mới" thay vì vòng tròn đếm lùi không? Đó chính là HOTP đấy!',
    summary:
      'TOTP tự động xoay vòng theo thời gian (thường 30s), còn HOTP thay đổi dựa trên bộ đếm số lần nhấn nút refresh.',
    sections: [
      {
        title: '1. Lịch sử ra đời: HOTP là đàn anh của TOTP',
        content:
          'Chuẩn HOTP (RFC 4226) ra đời trước vào năm 2005, dựa trên một bộ đếm số lần C (1, 2, 3...). Mỗi lần người dùng cần mã, bộ đếm tăng thêm 1. TOTP (RFC 6238) ra đời năm 2011, là sự kế thừa tinh tế: thay vì đếm số lần bấm, TOTP dùng số bước thời gian làm bộ đếm!',
      },
      {
        title: '2. So sánh đặc tính TOTP vs HOTP',
        content:
          '• TOTP (RFC 6238): Đổi mã tự động mỗi 30s hoặc 60s, không cần tương tác để làm mới, hết hạn tức thì.\n• HOTP (RFC 4226): Đổi mã khi người dùng bấm nút làm mới, mã tồn tại cho đến khi được nhập thành công.',
        diagram: {
          type: 'totp-vs-hotp-table',
          caption: 'So sánh cốt lõi TOTP và HOTP',
          items: [
            { label: 'TOTP', description: 'Dựa trên thời gian thực, tự đổi sau 30s' },
            { label: 'HOTP', description: 'Dựa trên bộ đếm lần bấm, tăng dần theo yêu cầu' },
          ],
        },
      },
      {
        title: '3. Hiện tượng lệch bước đếm trong HOTP & Cách giải quyết',
        content:
          'Nếu bạn bấm nút "Lấy mã mới" 5 lần nhưng không dùng để đăng nhập, bộ đếm trên điện thoại là 15 trong khi máy chủ vẫn ở số 10. Đừng lo! Máy chủ được thiết kế với "Cửa sổ nhìn trước" (Look-Ahead Window, thường 10 - 20 bước). Khi bạn đăng nhập bằng mã ở bước 15, máy chủ sẽ tự động đồng bộ nhảy vọt lên bước 15.',
        callout: {
          type: 'info',
          title: 'Cửa sổ nhìn trước',
          text: 'Máy chủ chấp nhận một dải bộ đếm kế tiếp để chống lệch số lần bấm nút.',
          icon: 'ℹ️',
        },
      },
    ],
    proTip:
      'Nếu dùng HOTP, hãy hạn chế bấm nút lấy mã liên tục mà không dùng, vì nếu vượt quá cửa sổ nhìn trước của máy chủ, tài khoản của bạn có thể bị khoá tạm thời đấy meo!',
    takeaway:
      'TOTP tiện lợi và phổ biến nhất cho người dùng di động vì mã tự hết hạn sau 30s. HOTP bền bỉ phù hợp cho các thiết bị không có pin đồng hồ thời gian thực.',
    quiz: {
      question:
        'Điều gì xảy ra nếu bạn bấm nút tạo mã HOTP nhiều lần nhưng không nhập vào trang web?',
      options: [
        { text: 'Ứng dụng sẽ tự xoá tài khoản đó ngay lập tức.', isCorrect: false },
        {
          text: 'Bộ đếm điện thoại vượt trước máy chủ, nhưng máy chủ có thể đồng bộ lại nhờ cửa sổ nhìn trước.',
          isCorrect: true,
        },
        { text: 'Mã HOTP sẽ tự động chuyển thành mã TOTP 30 giây.', isCorrect: false },
      ],
      explanation:
        'RFC 4226 quy định máy chủ có cửa sổ nhìn trước (Look-Ahead Window) để kiểm tra các bước đếm tiếp theo và tự động tái đồng bộ khi người dùng nhập mã mới nhất.',
    },
  },
  {
    id: 'lesson-4',
    index: 4,
    title: 'Tuyệt chiêu sao lưu an toàn',
    subtitle:
      'Tránh xa bẫy chụp màn hình lộ mã, tận dụng mã hoá chuẩn AES-256-GCM và bí kíp lưu trữ hạt giống phòng ngừa mất máy.',
    badge: 'Bảo mật cao',
    mascotId: 'shield-bunny',
    mascotName: 'Thỏ Shield',
    mascotEmoji: '🐰',
    readingTime: '3 phút',
    introQuote:
      'Ối ối! Đừng bao giờ chụp màn hình mã QR lưu vào thư viện ảnh nhé! Thỏ Shield sẽ chỉ cho bạn cách an toàn nhất nè!',
    summary:
      'Không lưu ảnh chụp màn hình mã QR. Luôn sử dụng file sao lưu mã hoá AES-256-GCM (.simpleotp) bảo vệ bằng mật khẩu mạnh.',
    sections: [
      {
        title: '1. Hiểm hoạ "Cạm bẫy chụp màn hình" (Screenshot Trap)',
        content:
          'Rất nhiều người có thói quen chụp màn hình mã QR 2FA rồi lưu trong điện thoại. Đây là lỗ hổng chết người: các bức ảnh thường tự động đồng bộ lên dịch vụ đám mây (iCloud, Google Photos) dưới dạng không mã hoá, và bất kỳ ứng dụng nào được cấp quyền truy cập thư viện ảnh đều có thể âm thầm quét đọc mã QR này!',
        callout: {
          type: 'warning',
          title: 'Cực kỳ nguy hiểm',
          text: 'Chụp màn hình mã QR biến bảo mật 2 lớp trở về lại thành 1 lớp duy nhất!',
          icon: '⚠️',
        },
      },
      {
        title: '2. Khoá bảo mật phần cứng (Hardware Vault Key)',
        content:
          'Trong Simple OTP, toàn bộ khoá bí mật được bảo vệ bằng khoá mã hoá 256-bit nằm trong chip bảo mật phần cứng của thiết bị (Secure Enclave / Android Keystore). Dữ liệu này không thể bị ứng dụng khác đọc lén.',
      },
      {
        title: '3. File sao lưu mã hoá chuẩn AES-256-GCM (.simpleotp)',
        content:
          'Khi xuất file sao lưu, Simple OTP sử dụng chuẩn mã hoá cấp quân sự:\n• KDF PBKDF2: Tạo khoá 256-bit từ mật khẩu của bạn sau 100,000 vòng lặp băm kèm chuỗi muối ngẫu nhiên (Salt 16-byte).\n• AES-256-GCM: Mã hoá toàn bộ kho tài khoản kèm mã xác thực (Auth Tag 16-byte). Nếu file bị sửa đổi dù chỉ 1 bit, giải mã sẽ thất bại ngay lập tức để bảo vệ bạn.',
        diagram: {
          type: 'backup-checklist',
          caption: 'Quy trình mã hoá sao lưu an toàn',
          items: [
            { label: 'Passphrase', description: 'Mật khẩu người dùng nhập' },
            { label: 'PBKDF2 100k', description: 'Dẫn xuất khoá mã hoá 256-bit' },
            { label: 'AES-256-GCM', description: 'Mã hoá dữ liệu + gắn Auth Tag' },
            { label: '.simpleotp', description: 'Tập tin xuất an toàn' },
          ],
        },
      },
      {
        title: '4. Quy tắc vàng khi bảo vệ mã xác thực',
        content:
          '✅ NÊN: Xuất file sao lưu .simpleotp với mật khẩu dài, lưu trên USB cá nhân hoặc ổ cứng rời.\n✅ NÊN: Chuyển tài khoản sang điện thoại mới bằng tính năng "Xuất mã QR riêng lẻ" trực tiếp giữa 2 máy.\n❌ KHÔNG: Gửi Secret Base32 qua Zalo, Messenger, Telegram hay Email chưa mã hoá.\n❌ KHÔNG: Đặt mật khẩu sao lưu trùng với ngày sinh hoặc mật khẩu quá ngắn.',
      },
    ],
    proTip:
      'Hãy xuất một bản sao lưu mã hoá ngay sau khi thêm tài khoản quan trọng, và ghi nhớ mật khẩu giải mã trong đầu hoặc két sắt an toàn nhé!',
    takeaway:
      'Sao lưu thông minh là sao lưu có mã hoá. Một file .simpleotp kết hợp mật khẩu mạnh là chiếc khiên vững chắc nhất bảo vệ bạn trước mọi sự cố mất máy.',
    quiz: {
      question:
        'Tại sao không nên chụp màn hình mã QR 2FA và lưu trong thư viện ảnh điện thoại?',
      options: [
        { text: 'Vì mã QR trong ảnh sẽ tự đổi màu sau 30 ngày.', isCorrect: false },
        {
          text: 'Vì ảnh trong thư viện dễ bị đồng bộ lên đám mây hoặc bị ứng dụng khác quét trộm không kiểm soát.',
          isCorrect: true,
        },
        { text: 'Vì chụp ảnh màn hình làm hỏng cảm biến camera của điện thoại.', isCorrect: false },
      ],
      explanation:
        'Thư viện ảnh thường được sao lưu tự động lên đám mây và nhiều ứng dụng có quyền đọc ảnh. Kẻ xấu có thể trích xuất khoá bí mật trực tiếp từ ảnh chụp mã QR.',
    },
  },
];

export function getLessonById(id: LessonId): AcademyLesson | undefined {
  return ACADEMY_LESSONS.find((lesson) => lesson.id === id);
}

export function getLessonByIndex(index: number): AcademyLesson | undefined {
  return ACADEMY_LESSONS.find((lesson) => lesson.index === index);
}
