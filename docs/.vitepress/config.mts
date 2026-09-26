import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Simple OTP',
  description: 'High-security, 100% offline 2FA authenticator with Reanimated mascot companions.',
  base: '/simple-otp/',

  head: [
    ['link', { rel: 'icon', href: '/simple-otp/favicon.png' }],
    ['meta', { name: 'theme-color', content: '#F76B00' }],
    [
      'script',
      {},
      `
      (function() {
        try {
          var base = '/simple-otp/';
          var path = window.location.pathname;
          var saved = localStorage.getItem('simple_otp_lang');
          var userLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
          var isVi = saved ? saved === 'vi' : userLang.startsWith('vi');

          if (path === base || path === base + 'index.html' || path === '/') {
            window.location.replace(base + (isVi ? 'vi/' : 'en/'));
          }
        } catch (e) {}
      })();
      `,
    ],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Getting Started', link: '/en/guide/getting-started' },
          { text: 'Security', link: '/en/guide/security-architecture' },
          { text: 'Backup & Restore', link: '/en/guide/backup-restore' },
          { text: 'Privacy Policy', link: '/en/privacy' },
        ],
        sidebar: [
          {
            text: 'Documentation',
            items: [
              { text: 'Getting Started', link: '/en/guide/getting-started' },
              { text: 'Security Architecture', link: '/en/guide/security-architecture' },
              { text: 'Backup & Restore', link: '/en/guide/backup-restore' },
              { text: 'Privacy Policy', link: '/en/privacy' },
            ],
          },
        ],
        footer: {
          message: 'Released under the MIT License. 100% Offline & Zero Network Tracking.',
          copyright: 'Copyright © 2026 Simple OTP',
        },
      },
    },
    vi: {
      label: 'Tiếng Việt',
      lang: 'vi',
      link: '/vi/',
      title: 'Simple OTP',
      description: 'Ứng dụng xác thực 2FA ngoại tuyến 100% với bảo mật phần cứng và trợ thủ ảo Reanimated.',
      themeConfig: {
        nav: [
          { text: 'Trang chủ', link: '/vi/' },
          { text: 'Bắt đầu', link: '/vi/guide/getting-started' },
          { text: 'Kiến trúc bảo mật', link: '/vi/guide/security-architecture' },
          { text: 'Sao lưu & Phục hồi', link: '/vi/guide/backup-restore' },
          { text: 'Quyền riêng tư', link: '/vi/privacy' },
        ],
        sidebar: [
          {
            text: 'Tài liệu hướng dẫn',
            items: [
              { text: 'Bắt đầu sử dụng', link: '/vi/guide/getting-started' },
              { text: 'Kiến trúc bảo mật', link: '/vi/guide/security-architecture' },
              { text: 'Sao lưu & Phục hồi', link: '/vi/guide/backup-restore' },
              { text: 'Chính sách quyền riêng tư', link: '/vi/privacy' },
            ],
          },
        ],
        footer: {
          message: 'Phát hành theo giấy phép MIT. Hoạt động ngoại tuyến 100% & Không thu thập dữ liệu.',
          copyright: 'Bản quyền © 2026 Simple OTP',
        },
      },
    },
  },

  themeConfig: {
    logo: '/icon.png',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/001123/simple-otp' },
    ],
    search: {
      provider: 'local',
    },
  },
})
