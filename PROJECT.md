# Project: Simple OTP

> High-security, 100% offline 2FA/OTP mobile application on Expo SDK 57.

## Architecture

Simple OTP is structured as a single-screen mobile application on Expo SDK 57 with an offline cryptographic core, hardware-backed secure storage, multi-channel ingestion, and an interactive pet mascot companion driven by Reanimated sprite sheets.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │   Single-Screen Dashboard (`src/app/index.tsx`, `_layout.tsx`)    │  │
│  │   - Header with Title & Real-Time Search Filter                  │  │
│  │   - TOTP Card with Animated Countdown Ring (<5s Urgency)         │  │
│  │   - HOTP Card with Counter Refresh Button                        │  │
│  │   - Bottom-Right Anchored Mascot Companion & Speech Bubble        │  │
│  │   - Floating Action Button (+) for Multi-Channel Ingestion        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│       │                         │                           │          │
│       ▼                         ▼                           ▼          │
│  ┌───────────────┐     ┌───────────────────┐      ┌─────────────────┐  │
│  │ Ingestion     │     │ Mascot System     │      │ Settings Modal  │  │
│  │ - Camera QR   │     │ - Sprite Sheets   │      │ - Biometrics    │  │
│  │ - Gallery QR  │     │ - 4 States/Mascot │      │ - Backup Export │  │
│  │ - Clipboard   │     │ - Speech Bubbles  │      │ - Backup Import │  │
│  │ - Manual Form │     │ - Pet Academy     │      │ - Pet Selector  │  │
│  └───────────────┘     └───────────────────┘      └─────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│                       Application Services Layer                       │
│  ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────────┐  │
│  │ Security/Auth   │   │ OTP Engine      │   │ Backup & Storage     │  │
│  │ - Biometrics    │   │ - RFC 6238 TOTP │   │ - PBKDF2 + AES-GCM   │  │
│  │ - Privacy Cover │   │ - RFC 4226 HOTP │   │ - Hardware MVK       │  │
│  │ - Zero Network  │   │ - URI Parser    │   │ - Encrypted DB File  │  │
│  └─────────────────┘   └─────────────────┘   └──────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Baseline Types | Generate expo-env.d.ts ambient types | M0 | survey |
| 2 | Baseline Linter | Configure ESLint & eslint.config.js | M0 | survey |
| 3 | Baseline Testing | Install and configure Jest & jest-expo | M0 | survey |
| 4 | Dependency Stack | Install SDK 57 packages & cryptographic libraries | M0 | survey |
| 5 | HMAC-SHA-1 Engine | Core TOTP token computation with SHA-1 | M1 | survey |
| 6 | HMAC-SHA-256 Engine | TOTP token computation with SHA-256 | M1 | survey |
| 7 | HMAC-SHA-512 Engine | TOTP token computation with SHA-512 | M1 | survey |
| 8 | Variable Digits | 6 and 8 digit zero-padded formatting | M1 | survey |
| 9 | Custom Periods | Standard 30s and custom (e.g. 60s) intervals | M1 | survey |
| 10 | Countdown Math | Time-step calculation & $<5$s urgency flag | M1 | survey |
| 11 | Time Tolerance | Drift window validation ($\pm 1$ step) | M1 | survey |
| 12 | HOTP Engine | RFC 4226 counter-based OTP generation | M1 | survey |
| 13 | Dynamic Truncation | 31-bit integer extraction from HMAC digest | M1 | survey |
| 14 | Counter Lifecycle | Counter increment & persistence logic | M1 | survey |
| 15 | Look-Ahead Window | Resynchronization look-ahead check | M1 | survey |
| 16 | URI Scheme & Type | Parse `otpauth://` scheme and `totp`/`hotp` type | M1 | survey |
| 17 | URI Label Parsing | Extract issuer prefix and account name | M1 | survey |
| 18 | URI Params | Extract secret, issuer, algo, digits, period, counter | M1 | survey |
| 19 | URI Precedence | Query param issuer takes precedence over label | M1 | survey |
| 20 | URI Tolerance | Ignore unknown query parameters safely | M1 | survey |
| 21 | URI Serializer | Two-way generation of standard `otpauth://` URI | M1 | survey |
| 22 | Base32 Decoder | Decode RFC 4648 Base32 to raw secret bytes | M1 | survey |
| 23 | Base32 Sanitizer | Strip whitespace/hyphens and convert to uppercase | M1 | survey |
| 24 | Base32 Padding | Handle both padded and unpadded strings | M1 | survey |
| 25 | Base32 Bit Validation | Verify unused trailing bits are zero | M1 | survey |
| 26 | Base32 Encoder | Encode raw bytes to canonical Base32 string | M1 | survey |
| 27 | Backup PBKDF2 | Derive 256-bit key from passphrase (100k iters) | M1 | survey |
| 28 | Backup AES-GCM Enc | Authenticated encryption of accounts vault | M1 | survey |
| 29 | Backup AES-GCM Dec | Authenticated decryption and tag verification | M1 | survey |
| 30 | Backup Container | `.simpleotp` schema (version, salt, iv, tag, data) | M1 | survey |
| 31 | Backup V2 Vectors | Verification of deterministic backup test vectors | M1 | survey |
| 32 | Hardware Vault Key | Store 256-bit MVK in SecureStore (Keychain/Keystore) | M1 | survey |
| 33 | Encrypted Accounts DB | Persist AES-GCM encrypted database file locally | M1 | survey |
| 34 | Biometric Auth | LocalAuthentication (FaceID, Fingerprint, PIN) | M2 | survey |
| 35 | Privacy Shield | Android FLAG_SECURE + iOS synchronous AppState shield | M2 | survey |
| 36 | Camera QR Scanner | Live QR scanning via CameraView | M2 | survey |
| 37 | Gallery QR Scanner | Offline QR decoding from photo library | M2 | survey |
| 38 | Clipboard Ingestion | Auto-detect `otpauth://` in clipboard on open | M2 | survey |
| 39 | Manual Ingestion Form | Form with real-time Base32 sanitization & validation | M2 | survey |
| 40 | Zero-Network Barrier | Runtime blocker guaranteeing 0 external requests | M2 | survey |
| 41 | Mascot Animation | Reanimated horizontal sprite sheet engine | M3 | survey |
| 42 | Cipher Cat Mascot | Cat sprite sheet (Idle, Copied, Warning, Empty) | M3 | survey |
| 43 | Byte Dog Mascot | Dog sprite sheet (Idle, Copied, Warning, Empty) | M3 | survey |
| 44 | Shield Bunny Mascot | Bunny sprite sheet (Idle, Copied, Warning, Empty) | M3 | survey |
| 45 | Reactive Speech | Event-driven contextual speech bubbles | M3 | survey |
| 46 | Pet Academy | 4-lesson interactive 2FA education bottom sheet | M3 | survey |
| 47 | Single-Screen Shell | Single-screen layout in `src/app/index.tsx` | M4 | survey |
| 48 | Real-Time Search | Instant filtering by issuer and account name | M4 | survey |
| 49 | Animated Ring | Circular countdown ring with $<5$s urgency pulse | M4 | survey |
| 50 | TOTP Card UX | 1-tap copy, haptic feedback, companion celebration | M4 | survey |
| 51 | HOTP Card UX | Counter increment button and dynamic recalculation | M4 | survey |
| 52 | Card Management | Rename and delete account actions | M4 | survey |
| 53 | Single Account QR | Export individual account QR with privacy shield | M4 | survey |
| 54 | Ingestion FAB (+) | Floating button anchored above mascot | M4 | survey |
| 55 | Settings Modal | Companion selector & biometric switch | M4 | survey |
| 56 | Backup Export Flow | Password-prompted export via expo-sharing | M4 | survey |
| 57 | Backup Import Flow | Password-prompted restore via document picker | M4 | survey |
| 58 | E2E Test Suite | 100% pass of Tiers 1-4 opaque-box tests | M5 | survey |
| 59 | Adversarial Hardening | Tier 5 white-box coverage hardening | M5 | survey |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Tooling Baseline & Environment Setup | Install SDK 57 dependencies, Jest, ESLint; fix ambient types; verify tsc/lint | None | DONE |
| M1 | Cryptographic Engine & Vault Storage | RFC 6238 TOTP, RFC 4226 HOTP, URI parser, Base32, AES-GCM backup, SecureStore MVK | M0 | DONE |
| M2 | Security Services & Ingestion | Biometrics, privacy screen cover, zero-network perimeter, camera/gallery/clipboard/manual ingestion | M0, M1 | DONE |
| M3 | Mascot Companion System & Pet Academy | Sprite sheets for Cat/Dog/Bunny (4 states), speech bubbles, Pet Academy bottom sheet | M0 | DONE |
| M4 | Single-Screen Dashboard & Token Management | Single-screen UX, TOTP/HOTP cards, countdown ring, search filter, FAB (+), Settings modal | M1, M2, M3 | DONE |
| M5 | Final Milestone: E2E Verification & Adversarial Hardening | Phase 1: 100% E2E test pass (Tiers 1-4). Phase 2: Tier 5 adversarial hardening | M4, TEST_READY | DONE |

## Parallel Track: E2E Testing Track

| Name | Scope | Dependencies | Status |
|------|-------|-------------|--------|
| E2E Testing Track | Design opaque-box test suite (Tiers 1-4) covering all features; publish TEST_INFRA.md and TEST_READY.md | M0 | DONE |

## Interface Contracts

### Cryptographic & Storage Engine (`src/services/`)

```typescript
// Token Definitions
export type OtpType = 'totp' | 'hotp';
export type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface OtpAccount {
  id: string; // UUID v4
  type: OtpType;
  issuer?: string;
  account: string;
  secret: string; // Normalized Base32
  algorithm: OtpAlgorithm;
  digits: 6 | 8;
  period: number; // default 30
  counter: number; // for HOTP
  createdAt: number;
}

// OTP Generator Interface
export function generateTotp(account: OtpAccount, timestamp?: number): string;
export function generateHotp(account: OtpAccount, counter: number): string;
export function getTotpProgress(account: OtpAccount, timestamp?: number): {
  remainingSeconds: number;
  progress: number; // 1.0 -> 0.0
  isUrgent: boolean; // remainingSeconds <= 5
};

// URI Parser & Generator
export function parseOtpAuthUri(uri: string): Omit<OtpAccount, 'id' | 'createdAt'>;
export function generateOtpAuthUri(account: OtpAccount): string;

// Base32 Interface
export function validateBase32(secret: string): { isValid: boolean; error?: string; cleaned: string };
export function decodeBase32(secret: string): Uint8Array;
export function encodeBase32(bytes: Uint8Array): string;

// Backup Envelope Schema
export interface EncryptedBackupContainer {
  format: 'simpleotp';
  version: 1;
  kdf: {
    algorithm: 'PBKDF2-HMAC-SHA256';
    iterations: number; // 100000
    salt: string; // Base64
  };
  cipher: {
    algorithm: 'AES-256-GCM';
    iv: string; // Base64
    tag: string; // Base64
  };
  ciphertext: string; // Base64
}

// Storage Vault Interface
export interface VaultStorageService {
  initializeVault(): Promise<void>;
  getAccounts(): Promise<OtpAccount[]>;
  saveAccount(account: OtpAccount): Promise<void>;
  updateAccount(account: OtpAccount): Promise<void>;
  deleteAccount(id: string): Promise<void>;
  incrementHotpCounter(id: string): Promise<{ newCounter: number; newCode: string }>;
}
```

### Security & Ingestion Contracts (`src/services/` & `src/components/`)

```typescript
// Biometrics
export interface BiometricAuthService {
  isBiometricAvailable(): Promise<boolean>;
  isBiometricEnrolled(): Promise<boolean>;
  authenticateUser(reason?: string): Promise<{ success: boolean; error?: string }>;
}

// Mascot Definitions
export type PetId = 'cipher-cat' | 'byte-dog' | 'shield-bunny';
export type PetState = 'IDLE' | 'COPIED' | 'WARNING' | 'EMPTY';

export interface PetCompanionProps {
  petId: PetId;
  state: PetState;
  onTap: () => void;
  speechMessage?: string | null;
}
```

## Code Layout

```
simple-otp/
├── assets/
│   └── images/
│       └── pets/
│           ├── cipher-cat-sprites.png
│           ├── byte-dog-sprites.png
│           └── shield-bunny-sprites.png
├── src/
│   ├── app/
│   │   ├── _layout.tsx           # Root navigation & theme provider
│   │   └── index.tsx             # Single-screen dashboard
│   ├── components/
│   │   ├── otp/
│   │   │   ├── TotpCard.tsx      # TOTP card with countdown ring
│   │   │   ├── HotpCard.tsx      # HOTP card with counter increment
│   │   │   └── CountdownRing.tsx # Animated SVG circular progress
│   │   ├── pet/
│   │   │   ├── PetCompanion.tsx  # Reanimated sprite sheet mascot
│   │   │   ├── SpeechBubble.tsx  # Reactive dialogue bubble
│   │   │   └── PetAcademyModal.tsx # Educational bottom sheet
│   │   ├── ingestion/
│   │   │   ├── IngestionSheet.tsx # Ingestion method chooser (FAB)
│   │   │   ├── CameraScannerModal.tsx # Live CameraView QR scan
│   │   │   └── ManualEntryModal.tsx   # Base32 validated input form
│   │   ├── settings/
│   │   │   ├── SettingsModal.tsx # Biometrics, pet select, backup
│   │   │   └── AccountQrModal.tsx # Single account export QR
│   │   ├── common/
│   │   │   └── PrivacyShield.tsx # Multitasking privacy cover
│   │   └── ...
│   ├── services/
│   │   ├── crypto/
│   │   │   ├── otpEngine.ts      # RFC 6238 & RFC 4226 implementation
│   │   │   ├── base32.ts         # RFC 4648 Base32 encoder/decoder
│   │   │   └── backupCipher.ts   # PBKDF2 + AES-GCM backup engine
│   │   ├── storage/
│   │   │   └── vaultStorage.ts   # Hardware MVK + Encrypted accounts DB
│   │   ├── auth/
│   │   │   └── biometricAuth.ts  # expo-local-authentication
│   │   ├── ingestion/
│   │   │   └── qrDecoder.ts      # Offline image QR decoding
│   │   └── network/
│   │       └── networkBlocker.ts # 0-network runtime barrier
│   ├── types/
│   │   └── otp.ts                # TypeScript domain models
│   └── hooks/
│       ├── useVault.ts           # Token management & timer state
│       └── useBiometrics.ts      # AppState & auth lock state
├── __tests__/
│   ├── unit/
│   │   ├── rfc6238.test.ts       # RFC 6238 Appendix B vectors
│   │   ├── rfc4226.test.ts       # RFC 4226 Appendix D vectors
│   │   ├── uriParser.test.ts     # otpauth:// URI test vectors
│   │   ├── base32.test.ts        # RFC 4648 test vectors & validation
│   │   └── backup.test.ts        # V2 round-trip integrity test
│   └── e2e/                      # Opaque-box E2E test suites (Tiers 1-4)
├── PROJECT.md
├── TEST_INFRA.md
└── TEST_READY.md
```
