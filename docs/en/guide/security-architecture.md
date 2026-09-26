# Security & Cryptographic Architecture

Simple OTP is designed around a **zero-trust, zero-network** architecture. Your cryptographic secrets never leave the physical device and are never exposed in plaintext to unauthenticated processes.

## Threat Model & Principles

1. **Zero External Network**: The application does not request network permissions and contains a runtime network barrier that blocks all external HTTP/WebSocket requests.
2. **Hardware-Backed Key Storage**: Master encryption keys are stored inside the platform's hardware-isolated keystore (iOS Keychain and Android Keystore via `expo-secure-store`).
3. **Authenticated Encryption at Rest**: Secrets and backup files are encrypted with **AES-256-GCM**, providing both confidentiality and cryptographic integrity verification.
4. **Resilience Against Side-Channel & Screen Leaks**: The application actively defends against screenshot captures and operating system task switcher previews.

---

## Cryptographic Specifications

### 1. Key Derivation & Vault Encryption

- **Master Vault Key (MVK)**: A 256-bit CSPRNG key is generated during vault initialization and stored in hardware-backed SecureStore.
- **Local Vault Storage**: The accounts database is encrypted with `AES-256-GCM` using a unique 12-byte initialization vector (IV) per save operation.
- **Integrity Tag**: A 128-bit authentication tag ensures data tampering or corruption is instantly detected before decryption.

### 2. Backup Encryption (`.simpleotp`)

When exporting a backup container, Simple OTP uses the following scheme:

```
Passphrase + 16-Byte Random Salt
               │
               ▼
   PBKDF2 (HMAC-SHA-256, 100,000 iterations)
               │
               ▼
       256-Bit Derived Key
               │
               ▼
   AES-256-GCM Authenticated Encryption
```

- **Salt**: 16 cryptographically secure random bytes generated per export.
- **Key Derivation**: PBKDF2 with HMAC-SHA-256 and **100,000 iterations** to mitigate brute-force and dictionary attacks.
- **Payload**: Full JSON accounts bundle encrypted using AES-256-GCM with a fresh 12-byte IV and 16-byte auth tag.

### 3. TOTP / HOTP Algorithm Implementation

- **TOTP (RFC 6238)**: Computes time-step counter $T = \lfloor (T_{now} - T_0) / T_x \rfloor$ (default period 30 seconds). Supports **HMAC-SHA-1**, **HMAC-SHA-256**, and **HMAC-SHA-512**.
- **HOTP (RFC 4226)**: Computes HMAC-SHA-1 over an 8-byte big-endian counter and applies 31-bit dynamic truncation.
- **Secret Padding**: Full RFC 4648 Base32 compliance with sanitization for trailing bits, hyphens, and whitespace.

---

## Runtime Defenses

### Screen Capture & Preview Protection

- **Android**: Enforces `FLAG_SECURE` at the native window level, blocking OS screenshots, screen recording, and task switcher snapshots.
- **iOS**: Synchronously mounts a high-security opaque privacy overlay whenever the app transitions into an inactive state (`AppState !== 'active'`), preventing sensitive token codes from being cached in the iOS app switcher thumbnail.
