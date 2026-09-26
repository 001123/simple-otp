---
layout: false
---

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const base = '/simple-otp/'
  const saved = localStorage.getItem('simple_otp_lang')
  const userLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase()
  const isVi = saved ? saved === 'vi' : userLang.startsWith('vi')
  window.location.replace(base + (isVi ? 'vi/' : 'en/'))
})
</script>

<div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; text-align: center; padding: 24px;">
  <img src="/icon.png" alt="Simple OTP" style="width: 80px; height: 80px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 10px 25px -5px rgba(247, 107, 0, 0.4);" />
  <h1 style="font-size: 1.5rem; margin-bottom: 12px; font-weight: 700;">Simple OTP</h1>
  <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 24px;">Redirecting to your language...</p>
  <div style="display: flex; gap: 12px;">
    <a href="./en/" style="padding: 8px 16px; border-radius: 8px; background: #F76B00; color: white; text-decoration: none; font-weight: 600; font-size: 0.875rem;">English</a>
    <a href="./vi/" style="padding: 8px 16px; border-radius: 8px; background: #334155; color: white; text-decoration: none; font-weight: 600; font-size: 0.875rem;">Tiếng Việt</a>
  </div>
</div>
