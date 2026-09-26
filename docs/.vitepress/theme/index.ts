import DefaultTheme from 'vitepress/theme'
import './custom.css'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (typeof window !== 'undefined') {
      // Auto-save user language choice on route navigation
      const updateLang = (path: string) => {
        if (path.includes('/vi/') || path.endsWith('/vi') || path.endsWith('/vi.html')) {
          localStorage.setItem('simple_otp_lang', 'vi')
        } else if (path.includes('/en/') || path.endsWith('/en') || path.endsWith('/en.html')) {
          localStorage.setItem('simple_otp_lang', 'en')
        }
      }

      // Initial track
      updateLang(window.location.pathname)

      // Listen for route changes
      const originalOnAfterRouteChanged = router.onAfterRouteChanged
      router.onAfterRouteChanged = (to: string) => {
        originalOnAfterRouteChanged?.(to)
        updateLang(to)
      }
    }
  },
} satisfies Theme
