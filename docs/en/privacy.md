# Privacy Policy

**Last Updated**: September 2026

Simple OTP is built from the ground up to respect and protect your privacy. This policy explains how we handle your information.

## 1. Zero Data Collection

- **No Personal Information**: Simple OTP does not collect your name, email, IP address, device identifier, or location.
- **No Analytics or Telemetry**: We do not use Firebase, Google Analytics, Sentry, or any third-party analytics or crash reporting SDKs.
- **No Advertising**: There are zero ads, tracking pixels, or marketing trackers in the application.

## 2. 100% Offline Operation

- **Zero-Network Architecture**: The app runs entirely offline and does not establish network connections.
- **Local Secret Storage**: All 2FA secrets, account names, and metadata are encrypted and stored exclusively in your device's hardware-backed SecureStore (`Keychain` on iOS, `Keystore` on Android).

## 3. Device Permissions

Simple OTP requests only the absolute minimum permissions needed for its functionality:

- **Camera**: Used exclusively for live scanning of 2FA QR codes. Video frames are analyzed in real time and are never saved or uploaded. Microphone and audio recording permissions are explicitly disabled.
- **Photo Library**: Used strictly when you choose to import a QR code image from your gallery.
- **Biometrics (Face ID / Fingerprint)**: Handled directly by the operating system's LocalAuthentication framework. Simple OTP never accesses or stores your raw biometric data.

## 4. Backups

Any backups you create are encrypted with your chosen passphrase using **PBKDF2 (100k iterations)** and **AES-256-GCM**. The resulting `.simpleotp` file is stored only where you choose to save it.

## 5. Open Source Transparency

Simple OTP is free and open-source software licensed under the MIT License. The complete source code is publicly inspectable and verifiable on [GitHub](https://github.com/kd-labs-io/simple-otp).

## Contact

If you have questions or concerns regarding this policy, feel free to open an issue or inquiry on our [GitHub Repository](https://github.com/kd-labs-io/simple-otp).
