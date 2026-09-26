# Simple OTP — Design System & Brand Identity Specification

> Comprehensive Design Guidelines, Mascot Anatomy, and Design Tokens for Simple OTP.  
> Target Platforms: iOS, Android, Web (Expo SDK 57).

---

## 1. Brand Philosophy & Core Metaphor

**Simple OTP** is built on a simple yet powerful premise:  
*Enterprise-grade cryptographic security should feel joyful, accessible, and crystal-clear.*

- **100% Offline by Design**: Zero network permissions, hardware-backed Keystore/Keychain enclave, AES-256-GCM encrypted vaults.
- **The Core Metaphor**: A friendly, vigilant little padlock robot (**Bé Khóa / Lock-bot**) that guards your digital keys. Security is no longer an intimidating black-box; it is an approachable companion giving you peace of mind.

---

## 2. Logo System & Master App Icon

### 2.1 Logo Construction & Key Elements

The official logo combines a 3D clay-style character mascot with bold, bubbly typography:

1. **The Mascot (Bé Khóa / Lock-bot)**:
   - Positioned prominently above or alongside the brand text.
   - Characterized by an ultra-smooth pearl white casing, glossy orange face screen, glowing orange shackle handle, asymmetric chibi eye + winking eye `(^_~)`, and a confident thumbs-up gesture `👍`.
2. **Typography "Simple OTP"**:
   - **"Simple"**: Rendered in pillowy, creamy white (`#FFFFFF`) 3D rounded lettering with gentle drop shadows.
   - **"OTP"**: Rendered in warm golden yellow (`#FFC820`) embossed 3D lettering. The letter **'O'** features an integrated **Keyhole silhouette**, directly symbolizing two-factor authentication access control.
   - **Energy Swoosh**: A curved golden underline accent sweeps beneath "Simple OTP", signifying fast, dynamic token generation.

### 2.2 Clear Space & Minimum Sizing

- **Safe Zone**: Maintain a minimum clear space equal to half the height of the letter "O" around all sides of the logo.
- **Minimum Display Sizes**:
  - Digital App Icon: `48 × 48 px` (Minimum readable favicon).
  - Full Wordmark + Mascot: `180 × 60 px`.
  - App Store / Google Play Master: `1024 × 1024 px` (full bleed, no pre-rounded corners; OS applies mask).

### 2.3 Logo Do's & Don'ts

| Do | Don't |
| :--- | :--- |
| Use official full-bleed orange gradient backgrounds for mobile app icons. | Do not add artificial drop-shadow borders or fake squircle cutouts inside the 1024×1024 master icon. |
| Maintain the keyhole cut inside the letter 'O' in "OTP". | Do not alter the keyhole proportions or replace it with a plain 'O'. |
| Keep the warm orange, golden yellow, and white color balance. | Do not recolor the lock shackle to green, purple, or non-brand hues. |
| Use high-resolution assets generated with anti-aliasing. | Do not stretch, skew, or flip the mascot horizontally (the thumbs-up gesture must remain natural). |

---

## 3. Color System & Design Tokens

Simple OTP uses an energetic, warm citrus palette anchored by rich amber oranges, golden yellows, and clean neutral surfaces.

### 3.1 Primary Brand Palette

| Token Name | Hex Value | RGB / HSL | Application |
| :--- | :--- | :--- | :--- |
| `BrandColors.primary` | `#F76B00` | `rgb(247, 107, 0)` | Primary buttons, active tabs, brand accents, Android adaptive background |
| `BrandColors.primaryLight` | `#F88100` | `rgb(248, 129, 0)` | Top gradient stop, lock shackle gloss, interactive hover |
| `BrandColors.primaryDark` | `#EE4200` | `rgb(238, 66, 0)` | Bottom gradient stop, pressed button states, shadows |
| `BrandColors.accentYellow` | `#FFC820` | `rgb(255, 200, 32)` | "OTP" wordmark, energy sparks, gold medals, achievement badges |
| `BrandColors.pearlWhite` | `#FFFFFF` | `rgb(255, 255, 255)` | Mascot helmet/hands, "Simple" wordmark, card backgrounds (light) |
| `BrandColors.blushPink` | `#FF8A9E` | `rgb(255, 138, 158)` | Cheerful rosy cheek blushes on Bé Khóa |

### 3.2 Semantic & Functional Colors

| Semantic Token | Hex Value | Meaning & Context |
| :--- | :--- | :--- |
| `SemanticColors.success` | `#34C759` | Successful token copy, Face ID authenticated, verified vault backup |
| `SemanticColors.urgent` | `#FF3B30` | TOTP timer countdown `< 5s` urgency state, delete confirmation |
| `SemanticColors.warning` | `#FF9500` | Clock drift alert, unencrypted backup warning |
| `SemanticColors.countdownNormal`| `#F76B00` / `#00C2FF` | Active 30s countdown progress ring (standard state) |
| `SemanticColors.neutral` | `#8E8E93` | Secondary labels, disabled states, empty slot borders |

### 3.3 Surface & Theme Tokens (`src/constants/theme.ts`)

```typescript
// Light Mode Surfaces
Colors.light = {
  text: '#000000',
  textSecondary: '#60646C',
  background: '#FFFFFF',
  backgroundElement: '#F0F0F3',    // Rounded 2FA Card background
  backgroundSelected: '#E0E1E6',   // Pressed card state
  primary: '#F76B00',
  tint: '#F76B00',
};

// Dark Mode Surfaces
Colors.dark = {
  text: '#FFFFFF',
  textSecondary: '#B0B4BA',
  background: '#000000',
  backgroundElement: '#212225',    // Dark elevated 2FA Card
  backgroundSelected: '#2E3135',   // Pressed dark card state
  primary: '#F76B00',
  tint: '#F88100',
};
```

---

## 4. Master Mascot Specification: Bé Khóa (Lock-bot)

### 4.1 Character Positioning & Brand Strategy

- **Official Name**: Bé Khóa (Vietnamese) / **Lock-bot** (International).
- **Brand Role**: **The Sole Primary Brand Ambassador**.  
  *Note on Legacy Companions:* Previous interim pet characters (*Byte Dog, Cipher Cat, Shield Bunny*) are slated for deprecation and will be unified under Bé Khóa's expressive multi-state system across the application.
- **Personality**: Cheerful, vigilant, reassuring, hyper-protective of your secrets, playful yet dependable.

### 4.2 3D Clay/Pixar Visual Anatomy

```
                   ╭─────────────╮
                   │ ╭─────────╮ │  <-- Lock Shackle (Glossy Orange #F88100)
                   │ │         │ │
             ╭─────┴─┴─────────┴─┴─────╮
    Spark    │   ╭─────────────────╮   │
   \  |  /   │   │  ●           ^  │   │  <-- Face Screen (Warm Orange #FA840D)
   - 🌟 -    │   │ (O)         (~) │   │      Left: Big Chibi Eye
             │   │    \_______/    │   │      Right: Winking Eye
             │   │  (◕)   👄   (◕) │   │      Center: Open Smile + Pink Blush
   👍 ───────┤   ╰─────────────────╯   ├────── (Resting White Arm)
 (Thumbs-up) ╰─────────────────────────╯
                  Helmet & Body Casing
             (Glossy Pearl White #FFFFFF)
```

1. **Helmet & Casing**: Smooth squircle capsule made of ceramic/clay with glossy specular highlights. Pure pearl white (`#FFFFFF`).
2. **Lock Shackle (Quai Khóa)**: Symmetrical curved tubular padlock handle atop the head. Coated in glossy amber-orange resin (`#F88100`).
3. **Face Screen**: Inset dark-orange digital glass visor with gentle curve reflections.
4. **Eyes**:
   - Left Eye: Large glossy dark chibi pupil with twin specular white light dots.
   - Right Eye: Playful winking curved crescent `(^_~)`.
5. **Cheeks & Smile**: Open happy mouth with pink tongue; soft oval blush patches (`#FF8A9E`).
6. **Hands & Gestures**: Floating white cartoon hands; primary signature gesture is a confident thumbs-up (`👍`).
7. **Sparks**: Three golden-yellow energy sparks radiating from the left side, representing active verification power.

### 4.3 Mascot State Machine Architecture

Bé Khóa dynamically reacts to user actions and vault states:

| State | Visual Behavior | Emotion / Voice | Trigger Context |
| :--- | :--- | :--- | :--- |
| **`IDLE`** | Gentle floating breathing motion, winking eye, occasional hand wave. | Cheerful, calm: *"All your keys are safe!"* | Normal dashboard browsing. |
| **`COPIED`** | Leaping joyfully with both thumbs up; burst of golden star confetti `✨`. | Enthusiastic celebration: *"Copied! Paste before timer expires!"* | Tapping a 2FA card to copy code. |
| **`WARNING`** | Wide alert eyes, tiny animated sweat drop, shackle flashes urgent orange/red. | Urgent, focused: *"Hurry! Code expires in <5 seconds!"* | Remaining TOTP time $\le 5\text{s}$. |
| **`EMPTY`** | Standing beside an open vault safe, hand pondering on chin. | Welcoming, helpful: *"Vault is empty! Scan a QR code to start!"* | No accounts configured in vault. |
| **`ACADEMY`** | Wearing a tiny graduation cap or wire spectacles, holding a golden key pointer. | Wise, encouraging mentor: *"Let's test your security knowledge!"* | In Pet Academy security lessons & quizzes. |

---

## 5. UI Component Design Guidelines

To comply with **Apple App Store Review Guideline 2.3.1** and **Google Play Metadata Policy**, all promotional and store graphics use an authentic **Skeleton UI 3D Cute** style reflecting actual app features.

### 5.1 2FA Account Cards (`TotpCard` & `HotpCard`)
- **Container**: Card with `border-radius: 18px`, elevated with subtle ambient shadow (`rgba(0, 0, 0, 0.06)`).
- **Service Avatar**: Left-aligned `40 × 40 px` rounded icon badge (Google, GitHub, Discord, AWS).
- **Token Display**: 6-digit or 8-digit split numbers (`482 195`) set in bold monospace typography (`ui-monospace`, `Courier New`).
- **Countdown Timer**: Circular ring showing remaining seconds with color transition (Orange $\to$ Red when $<5\text{s}$).

### 5.2 Camera & Gallery QR Viewfinder (`CameraScannerModal`)
- **Viewfinder**: Darkened camera background with 4 luminous rounded corner brackets `[  ]`.
- **Laser Scan Beam**: Horizontal cyan holographic scan line animating vertically.
- **Actions**: Floating pill button "Import from Photos" with gallery icon.

### 5.3 Floating Action Button (FAB)
- Circular `56 × 56 px` button positioned at bottom-right (`bottom: 32px`, `right: 24px`).
- Colored in brand primary orange (`#F76B00`) with white plus icon (`+`) and elevated depth.

### 5.4 Dialogs & Modals
- Top drag indicator pill (`width: 36px`, `height: 5px`, `border-radius: 3px`).
- Clean section dividers, native iOS/Android haptic feedback on state toggles (`Haptics.impactAsync`).

---

## 6. Asset Catalog & Store Graphics Reference

All production-ready assets are rendered and checked in the repository:

### 6.1 Application Icons (`assets/images/`)
- [`icon.png`](file:///Users/timi/work/simple-otp/assets/images/icon.png): Master `1024 × 1024 px` PNG for iOS App Store & Universal Expo build.
- [`android-icon-foreground.png`](file:///Users/timi/work/simple-otp/assets/images/android-icon-foreground.png): `512 × 512 px` Adaptive Icon Foreground (within 66% Safe Zone).
- [`android-icon-background.png`](file:///Users/timi/work/simple-otp/assets/images/android-icon-background.png): `512 × 512 px` Solid brand orange gradient background.
- [`splash-icon.png`](file:///Users/timi/work/simple-otp/assets/images/splash-icon.png): `512 × 512 px` App launch splash screen symbol.
- [`favicon.png`](file:///Users/timi/work/simple-otp/assets/images/favicon.png): `64 × 64 px` Web browser icon.

### 6.2 Store Marketing Banners (`assets/banners/`)

Both Vietnamese (`assets/banners/vi`) and English (`assets/banners/en`) editions are organized and formatted to store specification:

| File Name | Dimensions | Platform | Content Description |
| :--- | :--- | :--- | :--- |
| `00_feature_graphic.png` | `1024 × 500 px` | Google Play Store | Master 3D Logo, Bé Khóa mascot, golden shield, miniature safe vault, localized tagline. |
| `01_offline_security.png` | `1080 × 1920 px` (9:16) | App Store & Google Play | **100% Offline & Face ID**: 3D phone mockup with cute skeleton OTP cards, Face ID shield. |
| `02_qr_scanner.png` | `1080 × 1920 px` (9:16) | App Store & Google Play | **Instant QR Scanner**: 3D phone with camera viewfinder brackets, holographic laser, gallery import button. |
| `03_pet_academy.png` | `1080 × 1920 px` (9:16) | App Store & Google Play | **Pet Academy & Mascot**: Security quiz card with Yes/No buttons, Bé Khóa & companion dialogue bubbles. |
| `04_encrypted_backup.png` | `1080 × 1920 px` (9:16) | App Store & Google Play | **Encrypted Backup**: Military-grade PBKDF2/AES-GCM vault export dialog, golden safe with key. |
