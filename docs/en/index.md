---
layout: home

hero:
  name: "Simple OTP"
  text: "High-Security, 100% Offline 2FA"
  tagline: "Your two-factor authentication tokens protected by hardware encryption and guarded by an interactive companion mascot."
  image:
    src: /icon.png
    alt: Simple OTP Logo
  actions:
    - theme: brand
      text: Get Started
      link: /en/guide/getting-started
    - theme: alt
      text: Security Architecture
      link: /en/guide/security-architecture
    - theme: alt
      text: GitHub Repo
      link: https://github.com/kd-labs-io/simple-otp

features:
  - icon: 🛡️
    title: 100% Offline & Zero Network
    details: Zero network permissions, no analytics, no external servers, and zero telemetry. Your secrets never leave your device.
  - icon: 🔐
    title: Hardware-Backed Vault
    details: Master Vault Keys derived with PBKDF2 (100k iterations) and stored in iOS Keychain / Android Keystore with AES-256-GCM encryption.
  - icon: ⚡
    title: RFC 6238 & 4226 Compliant
    details: Complete support for TOTP (time-based) and HOTP (counter-based) standards with SHA-1, SHA-256, and SHA-512 algorithms.
  - icon: 📷
    title: Multi-Channel Ingestion
    details: Scan QR codes live from camera, import QR images from gallery, auto-detect clipboard auth URIs, or enter keys manually.
  - icon: 🐱
    title: Companion Mascots
    details: Animated Reanimated sprite companions (Cipher Cat, Byte Dog, Shield Bunny) that react to your actions with contextual speech bubbles.
  - icon: 📦
    title: Encrypted Portable Backups
    details: Export and restore your 2FA accounts in password-protected `.simpleotp` encrypted packages with authenticated integrity.
---
