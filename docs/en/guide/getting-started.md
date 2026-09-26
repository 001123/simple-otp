# Getting Started

Welcome to **Simple OTP**, an offline, open-source 2FA authenticator designed with privacy and security as top priorities.

## Key Features

- **100% Offline**: Zero external network calls. No cloud sync, no tracking, no third-party telemetry.
- **Biometric Security**: Unlock with Face ID, Fingerprint, or device PIN.
- **Privacy Shield**: Prevents screenshots and masks sensitive screens in the app switcher (`FLAG_SECURE` on Android and privacy overlay on iOS).
- **Mascot Companions**: Choose between **Cipher Cat**, **Byte Dog**, and **Shield Bunny** to guide you through two-factor authentication.

## Installation & Setup

### Requirements

- **iOS**: iOS 15.1 or later.
- **Android**: Android 9.0 (API level 28) or later.

### Adding Your First 2FA Account

You can add accounts using four different ingestion methods:

1. **Scan QR Code (Camera)**:
   - Tap the floating `+` button on the dashboard.
   - Select **Scan QR Code** and point your device camera at the 2FA setup QR code from your service (e.g. GitHub, Google, AWS).
   
2. **Scan from Photo Library**:
   - Save or screenshot a 2FA QR code to your device gallery.
   - Tap `+` -> **Pick from Gallery**. The app extracts and validates the token completely on-device.

3. **Paste from Clipboard**:
   - Copy any standard `otpauth://totp/...` or `otpauth://hotp/...` URI.
   - When you open Simple OTP, it prompts you to add the detected token instantly.

4. **Manual Entry**:
   - If a QR code is not available, choose **Enter Manually**.
   - Input the Account Name, Issuer, and Base32 Secret Key. The app sanitizes spaces and hyphens automatically.

## Managing Tokens

- **Copy Token**: Tap any token card to copy the 6-digit or 8-digit OTP code directly to your clipboard.
- **Search**: Use the real-time search bar at the top to filter accounts by service or username.
- **Urgency Indicator**: When a TOTP code has less than 5 seconds remaining, the countdown indicator turns red to warn you before the token rotates.
- **HOTP Counter**: For counter-based tokens, tap the reload button to compute the next valid OTP value.
