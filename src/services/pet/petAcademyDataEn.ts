import type { AcademyLesson } from '@/types/pet';

export const ACADEMY_LESSONS_EN: AcademyLesson[] = [
  {
    id: 'lesson-1',
    index: 1,
    title: 'Why Passwords Alone Are Never Enough',
    subtitle:
      'Understand the risks of data breaches, credential stuffing attacks, and why static passwords cannot protect you forever.',
    badge: 'Fundamental',
    mascotId: 'cipher-cat',
    mascotName: 'Cipher Cat',
    mascotEmoji: '🐱',
    readingTime: '2 min',
    introQuote: 'Meow! Think a 16-character password is 100% invincible? Think again!',
    summary:
      'Static passwords stored on remote servers are always prone to data leaks. Credential stuffing turns a minor forum breach into a threat against all your critical accounts.',
    sections: [
      {
        title: '1. The Illusion of Static Password Safety',
        content:
          'A password is a fixed string stored on a service provider’s database. Even if you choose an intricate passphrase, if the company suffers a data breach, hashed passwords can be cracked or leaked in plaintext.',
        callout: {
          type: 'warning',
          title: 'Shocking Statistic',
          text: 'Over 15 billion credentials have been exposed across major database leaks on the internet!',
          icon: 'warning',
        },
      },
      {
        title: '2. The Menace of Credential Stuffing',
        content:
          'Most internet users reuse passwords across multiple sites like Facebook, Gmail, banks, and community forums. When a small hobby forum is breached, attackers use automated botnets to try that same email/password combo on vital platforms.',
        diagram: {
          type: 'credential-stuffing',
          caption: 'Credential Stuffing Attack Lifecycle',
          items: [
            { label: 'Step 1', description: 'Small gaming forum database is breached.' },
            { label: 'Step 2', description: 'Attackers harvest list of email + password combos.' },
            { label: 'Step 3', description: 'Automated bots test logins on Gmail, GitHub, Banks.' },
            { label: 'Step 4', description: 'Without 2FA, attackers gain full unauthorized access!' },
          ],
        },
      },
      {
        title: '3. How Two-Factor Authentication (2FA) Saves You',
        content:
          'Two-factor authentication adds a second defensive layer independent of passwords. Even if an attacker learns your password, without physical possession of the device holding your OTP keys, they are blocked at the gate.',
        callout: {
          type: 'tip',
          title: '2FA Shield',
          text: 'Enabling 2FA blocks more than 99% of automated account takeover attacks.',
          icon: 'tip',
        },
      },
    ],
    proTip:
      'Never reuse passwords across sites. But most importantly: enable 2FA on every critical account today, meow!',
    takeaway:
      'Passwords are only "Something you know". 2FA adds "Something you have" (your offline OTP authenticator device) to neutralize 99.9% of credential theft attacks.',
    quiz: {
      question: 'Why can hackers still compromise accounts even when you use strong passwords?',
      options: [
        { text: 'Because strong passwords are easier to guess than short ones.', isCorrect: false },
        {
          text: 'Due to service provider database breaches and common password reuse habits.',
          isCorrect: true,
        },
        { text: 'Because phones automatically transmit passwords to hackers.', isCorrect: false },
      ],
      explanation:
        'No matter how strong a password is, if the service provider’s servers are breached or you reuse the password across sites, attackers can still steal it.',
    },
  },
  {
    id: 'lesson-2',
    index: 2,
    title: 'TOTP vs HOTP: Time-Based vs Counter-Based',
    subtitle:
      'Unravel the mathematics behind standard RFC 6238 and RFC 4226 algorithms, time windows, and counter synchronization.',
    badge: 'Technical Core',
    mascotId: 'byte-dog',
    mascotName: 'Byte Dog',
    mascotEmoji: '🐶',
    readingTime: '3 min',
    introQuote: 'Woof woof! Ever wondered why 6-digit codes magically refresh every 30 seconds? Let’s sniff out the math!',
    summary:
      'TOTP uses Unix timestamp slices, while HOTP increments an internal counter per code request. Both rely on HMAC hash truncation.',
    sections: [
      {
        title: '1. HOTP: RFC 4226 Event-Driven Tokens',
        content:
          'HOTP (HMAC-based One-Time Password) uses an internal event counter (C). Every time you hit refresh, the counter increments: C = C + 1. The token is generated via HMAC-SHA-1(Secret, Counter). The server matches the counter within a look-ahead window.',
        callout: {
          type: 'info',
          title: 'HOTP Counter Trait',
          text: 'HOTP tokens never expire based on time; they remain valid until used or surpassed by the next counter.',
          icon: 'info',
        },
      },
      {
        title: '2. TOTP: RFC 6238 Time-Step Tokens',
        content:
          'TOTP is an evolution of HOTP where Counter is replaced by the current Unix time divided by 30 seconds: T = floor(CurrentTime / 30). Because both your device and the server share the same global time, codes match without internet communication!',
        diagram: {
          type: 'totp-vs-hotp-table',
          caption: 'Comparison: TOTP vs HOTP Mechanisms',
          items: [
            { label: 'Time Step', description: 'TOTP recalculates every 30s based on Unix timestamp.' },
            { label: 'Event Counter', description: 'HOTP only advances when you press the button.' },
            { label: 'Network Need', description: 'Neither needs internet access to compute codes.' },
          ],
        },
      },
      {
        title: '3. Clock Drift and Urgency Windows',
        content:
          'Because device clocks can vary by a few seconds, RFC 6238 allows ±1 time step tolerance. In Simple OTP, the countdown ring turns urgent red during the final 5 seconds to prompt quick entry.',
      },
    ],
    proTip:
      'If TOTP codes fail on login, check that your device system time is set to automatic network time, woof!',
    takeaway:
      'TOTP uses time as its counter; HOTP uses manual clicks. Both are pure math calculated offline without network.',
    quiz: {
      question: 'Why can Simple OTP generate accurate TOTP codes with 100% offline air-gap mode?',
      options: [
        { text: 'Because it secretly connects to satellite towers.', isCorrect: false },
        {
          text: 'Because both your device and the server rely on shared global Unix time and identical math formulas.',
          isCorrect: true,
        },
        { text: 'Because codes are pre-downloaded for the entire year.', isCorrect: false },
      ],
      explanation:
        'Both the server and your device compute HMAC-SHA1 using the identical shared secret and current Unix epoch time step, producing the exact same token with zero network communication.',
    },
  },
  {
    id: 'lesson-3',
    index: 3,
    title: 'The Offline Cryptographic Core',
    subtitle:
      'Explore PBKDF2 key derivation, authenticated AES-256-GCM encryption, and hardware-backed Keychain keystores.',
    badge: 'Deep Dive',
    mascotId: 'cipher-cat',
    mascotName: 'Cipher Cat',
    mascotEmoji: '🐱',
    readingTime: '3 min',
    introQuote: 'Purr~ In our vault, math is the strongest padlock in the universe. Let me show you how it works!',
    summary:
      'Zero-network policy combined with AES-256-GCM authenticated encryption and hardware Master Vault Keys guarantees absolute isolation from cyber threats.',
    sections: [
      {
        title: '1. Hardware Key Storage: SecureStore',
        content:
          'Simple OTP creates a random 256-bit Master Vault Key (MVK) inside Apple iOS Keychain or Android Keystore backed by hardware Secure Enclaves. Even if your phone is connected to a computer, memory cannot be dumped.',
      },
      {
        title: '2. Authenticated Encryption: AES-256-GCM',
        content:
          'All account records and Base32 secrets are encrypted with AES-GCM. GCM mode includes an authentication tag (Auth Tag) that immediately detects any tampering or corruption.',
        callout: {
          type: 'tip',
          title: 'Tamper Proof',
          text: 'If even a single bit of encrypted data is altered, AES-GCM decryption throws an integrity error.',
          icon: 'shield',
        },
      },
      {
        title: '3. Hardened Key Derivation: PBKDF2',
        content:
          'When exporting encrypted backups, your passphrase is run through 100,000 iterations of PBKDF2-HMAC-SHA256 with a unique random salt, rendering brute-force attacks computationally infeasible.',
      },
    ],
    proTip:
      'An offline app with hardware encryption is vastly superior to cloud authenticators that expose keys to remote breaches, meow!',
    takeaway:
      'Hardware MVK + AES-GCM + PBKDF2 ensures that only you, on your physical hardware, can unlock your credentials.',
    quiz: {
      question: 'What happens if someone modifies encrypted backup data without the correct passphrase?',
      options: [
        { text: 'The app decodes whatever it can guess.', isCorrect: false },
        {
          text: 'AES-256-GCM authentication tag verification fails, rejecting corrupt data entirely.',
          isCorrect: true,
        },
        { text: 'The phone automatically resets to factory settings.', isCorrect: false },
      ],
      explanation:
        'AES-256-GCM features an authentication tag that detects any byte modifications, instantly rejecting compromised or corrupted ciphertexts.',
    },
  },
  {
    id: 'lesson-4',
    index: 4,
    title: 'Safe Backup & Disaster Recovery',
    subtitle:
      'Master backup strategies: cold storage, strong passphrases, and seamless restore workflows without cloud dependency.',
    badge: 'Best Practices',
    mascotId: 'shield-bunny',
    mascotName: 'Shield Bunny',
    mascotEmoji: '🐰',
    readingTime: '2 min',
    introQuote: 'Digital shields protect your today, but smart backups safeguard your tomorrow! Hop along with me!',
    summary:
      'Never rely on a single device. Export encrypted .simpleotp backups and store them in secure cold storage locations.',
    sections: [
      {
        title: '1. The Danger of Single-Device Risk',
        content:
          'Phones can be dropped, lost, stolen, or damaged. If you do not have a backup of your 2FA seeds, recovering access to email, banking, or crypto accounts can take weeks or prove impossible.',
      },
      {
        title: '2. The Cold Storage Rule',
        content:
          'Export a .simpleotp backup with a strong passphrase. Store this file on an offline USB drive or an encrypted hard drive in a physical safe, never on unencrypted cloud sync drives.',
        callout: {
          type: 'warning',
          title: 'Passphrase Rule',
          text: 'Simple OTP never transmits or stores your backup passphrase. If you forget it, the backup cannot be cracked!',
          icon: 'lock',
        },
      },
      {
        title: '3. Merge vs Replace Restore Strategies',
        content:
          'When restoring a backup on a new device, choose "Merge" to combine accounts or "Replace" to overwrite your vault completely with the backup archive.',
      },
    ],
    proTip:
      'Print recovery codes provided by services during 2FA setup and keep them in a fireproof safe, bunny tip!',
    takeaway:
      'A regular encrypted backup stored in cold physical storage is your ultimate insurance policy against device loss.',
    quiz: {
      question: 'Where is the safest place to store your encrypted .simpleotp backup file?',
      options: [
        { text: 'Public photo albums or shared social media folders.', isCorrect: false },
        {
          text: 'An offline USB drive or encrypted local storage kept securely in your home.',
          isCorrect: true,
        },
        { text: 'Nowhere, backups are unnecessary if your phone has a passcode.', isCorrect: false },
      ],
      explanation:
        'Offline cold storage such as a dedicated USB drive in a safe location guarantees immunity from remote cloud leaks and malware access.',
    },
  },
];
