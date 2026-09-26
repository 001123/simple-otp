# Original User Request

## Initial Request — 2026-09-26T13:53:49+07:00

Build Simple OTP, a high-security, 100% offline 2FA/OTP authenticator mobile application on Expo SDK 57 featuring a streamlined single-screen UX, TOTP/HOTP token management, hardware-backed encrypted storage, and an interactive pet mascot companion driven by sprite sheet animations.

Working directory: /Users/timi/work/simple-otp
Integrity mode: development

Reference plan: project/plan/01.DETAILED-PLAN.MD

## Requirements

### R1. Offline OTP Engine & Secure Storage Vault
Implement RFC 6238 (TOTP) and RFC 4226 (HOTP) token generation supporting SHA-1, SHA-256, and SHA-512 algorithms, custom period intervals (e.g. 30s, 60s), and variable digit lengths (6 or 8 digits). Support two-way parsing and generation of standard `otpauth://` URIs. Token secrets and configuration metadata must be stored locally using hardware-backed encrypted storage with optional biometric authentication (Face ID / Fingerprint / PIN) and privacy screen shielding during multitasking.

### R2. Single-Screen Token Management Experience
Provide a streamlined single-screen dashboard with instant real-time search filtering. Render TOTP cards featuring animated circular countdown progress indicators that visually highlight when less than 5 seconds remain, with single-tap clipboard copying and haptic feedback. Render HOTP cards with counter increment triggers. Support card actions for renaming and deletion.

### R3. Multi-Channel Ingestion & Encrypted Backup
Allow adding OTP accounts via live camera QR code scanning, photo library image QR detection, auto-detected clipboard URIs, and manual entry with Base32 secret validation. Implement password-based AES-GCM encrypted backup export and restore (`.simpleotp`), as well as individual account QR code export for device transfer.

### R4. Sprite Sheet Pet Companion & Pet Academy
Provide an interactive pet companion (Cipher Cat, Byte Dog, Shield Bunny) anchored in the bottom-right corner powered by sprite sheet animations for key states: Idle, Copied celebration, Warning urgency (<5s), and Empty vault. Tapping the companion triggers reactive speech bubbles and provides access to "Pet Academy", an educational sheet explaining 2FA principles and safe backup practices.

### R5. Offline Architecture
All functionality must operate entirely offline without network access or remote analytics.

## Verification Resources & Requirements

### V1. Algorithm Test Vectors
The OTP generator must be verified against official RFC test vectors for:
- RFC 6238 (TOTP with SHA-1, SHA-256, SHA-512 at designated timestamps)
- RFC 4226 (HOTP across successive counter values)
- URI parser with standard and edge-case `otpauth://` parameters

### V2. Backup Round-Trip Integrity
The backup engine must be programmatically verified: exporting accounts with a passphrase, encrypting with AES-GCM, and re-importing using the passphrase must yield the exact original account set and secrets, while an invalid passphrase must fail cleanly.

## Acceptance Criteria

### Core Functionality & Security
- [ ] TOTP tokens generate correct codes matching RFC 6238 test vectors for 6- and 8-digit outputs across standard time intervals.
- [ ] HOTP tokens increment accurately on demand and match RFC 4226 test vectors.
- [ ] `otpauth://` URI parser correctly extracts secret, issuer, account name, algorithm, digits, and period/counter.
- [ ] Token secrets are stored using hardware-backed secure storage.
- [ ] App makes 0 external network requests during all operations.
- [ ] Biometric lock successfully prompts and controls vault access when enabled.

### Ingestion & Backup
- [ ] Camera scanner and gallery picker successfully parse `otpauth://` QR codes.
- [ ] Manual input form validates Base32 keys and prevents invalid entries.
- [ ] Encrypted backup exports an AES-GCM payload and cleanly restores accounts upon passphrase entry.

### UI & Pet Companion
- [ ] Countdown progress indicator smoothly reflects remaining time and transitions to warning state under 5 seconds.
- [ ] Single tap copies code, provides haptic feedback, and triggers pet celebratory animation.
- [ ] Pet companion displays sprite sheet animations for Idle, Copied, Warning, and Empty states.
- [ ] Pet Academy bottom sheet displays educational cards on 2FA security.

### Code Quality & Automated Tests
- [ ] Automated unit test suite passes for OTP generation, URI parsing, and backup encryption round-trip.
- [ ] TypeScript check (`npx tsc --noEmit`) passes with 0 errors.
- [ ] Lint check (`npx expo lint`) passes with 0 errors.
