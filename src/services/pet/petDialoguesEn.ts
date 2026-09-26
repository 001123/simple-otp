import type { PetId, PetState, PetDialogueItem } from '@/types/pet';

export const PET_DIALOGUES_EN: Record<PetId, Record<PetState | 'TIPS', PetDialogueItem[]>> = {
  'cipher-cat': {
    IDLE: [
      { id: 'cat_idle_1', text: 'OTP tokens are securely encrypted in hardware Keychain.' },
      { id: 'cat_idle_2', text: 'Watching every millisecond, everything is under control.' },
      { id: 'cat_idle_3', text: 'Your shared secret is strictly protected by SHA-256.' },
      { id: 'cat_idle_4', text: 'Meow! The app is 100% offline, untouchable by hackers.' },
      { id: 'cat_idle_5', text: 'Need a login code? Just a quick tap, purr~' },
      { id: 'cat_idle_6', text: 'I love perfect algorithms... just like your code vault.' },
    ],
    COPIED: [
      { id: 'cat_copy_1', text: 'Code copied! Paste quickly before it rotates. Purr~' },
      { id: 'cat_copy_2', text: 'Code is in clipboard! Absolutely accurate digits.' },
      { id: 'cat_copy_3', text: 'Copy successful! Precise as a feline pounce.' },
      { id: 'cat_copy_4', text: '2FA code is ready! Safe login ahead.' },
      { id: 'cat_copy_5', text: 'Copied! This code only lasts a short window for maximum security.' },
    ],
    WARNING: [
      { id: 'cat_warn_1', text: 'Only 4 seconds left, copy fast!' },
      { id: 'cat_warn_2', text: 'Urgent! Loop closing, new code coming soon!' },
      { id: 'cat_warn_3', text: 'Countdown clock nearing the bottom! Hurry!' },
      { id: 'cat_warn_4', text: 'Meow! Time is almost up, act fast!' },
      { id: 'cat_warn_5', text: '3, 2, 1... Code rotating! Copy now if needed!' },
    ],
    EMPTY: [
      { id: 'cat_empty_1', text: 'Vault is empty meow~ Tap [+] to add your first secret key!' },
      { id: 'cat_empty_2', text: 'No accounts protected yet. Scan a QR code to get started!' },
      { id: 'cat_empty_3', text: 'Meow! Give me a secret key, I will encrypt it into safe vault.' },
      { id: 'cat_empty_4', text: 'Secure inbox is waiting. Tap [+] above to add a new code!' },
    ],
    TIPS: [
      { id: 'cat_tip_1', text: 'Tip from Cipher Cat: Never save 2FA QR screenshots in cloud photos!', actionText: 'Open Pet Academy' },
      { id: 'cat_tip_2', text: 'Security tip: Export encrypted .simpleotp backups and store safely.', actionText: 'Open Pet Academy' },
      { id: 'cat_tip_3', text: 'Did you know? TOTP = HMAC(Secret + Time). 100% math, zero internet required!', actionText: 'Open Pet Academy' },
      { id: 'cat_tip_4', text: 'Meow! Tapping me means you want to learn more about 2FA? Check it out!', actionText: 'Open Pet Academy' },
    ],
  },
  'byte-dog': {
    IDLE: [
      { id: 'dog_idle_1', text: 'Woof woof! Guarding your vault 24/7!' },
      { id: 'dog_idle_2', text: 'Zero strange network packets can slip past my watch!' },
      { id: 'dog_idle_3', text: 'All credentials are safe in my paws, relax!' },
      { id: 'dog_idle_4', text: 'Which code do you need? Just tap and I will fetch it!' },
      { id: 'dog_idle_5', text: 'Woof! Have a secure and energetic day!' },
      { id: 'dog_idle_6', text: 'Standing on guard here, no hacker can sneak in!' },
    ],
    COPIED: [
      { id: 'dog_copy_1', text: 'Woof woof! Code copied successfully!' },
      { id: 'dog_copy_2', text: 'Awesome! Code is sitting safely in your clipboard!' },
      { id: 'dog_copy_3', text: 'Grabbed the code for you! Paste quickly to sign in!' },
      { id: 'dog_copy_4', text: 'Woof! Copy mission accomplished 100%!' },
      { id: 'dog_copy_5', text: 'Code copied! Ready for the next rotation.' },
    ],
    WARNING: [
      { id: 'dog_warn_1', text: 'Hurry up! Code is changing soon!' },
      { id: 'dog_warn_2', text: 'Woof woof! Just seconds remaining, urgent!' },
      { id: 'dog_warn_3', text: 'Countdown ring is red, seize the moment and copy!' },
      { id: 'dog_warn_4', text: 'Time running out! Act fast!' },
      { id: 'dog_warn_5', text: 'Woof! 5 seconds left! Can you copy in time?' },
    ],
    EMPTY: [
      { id: 'dog_empty_1', text: 'Vault is empty! Tap [+] so I have a code to guard, woof!' },
      { id: 'dog_empty_2', text: 'No 2FA keys yet. Tap the button to import a QR code!' },
      { id: 'dog_empty_3', text: 'Bark! I am ready and excited to protect your accounts!' },
      { id: 'dog_empty_4', text: 'Lonely vault! Scan a QR code right away, woof!' },
    ],
    TIPS: [
      { id: 'dog_tip_1', text: 'Byte Dog tip: Always enable Biometric Lock in Settings!', actionText: 'Open Pet Academy' },
      { id: 'dog_tip_2', text: 'Byte Dog tip: HOTP only increments when you tap refresh.', actionText: 'Open Pet Academy' },
      { id: 'dog_tip_3', text: 'Byte Dog tip: Never give your 2FA code to anyone claiming to be tech support!', actionText: 'Open Pet Academy' },
      { id: 'dog_tip_4', text: 'Woof! 2FA blocks 99% of automated attacks. Want to learn more?', actionText: 'Open Pet Academy' },
    ],
  },
  'shield-bunny': {
    IDLE: [
      { id: 'bunny_idle_1', text: 'Digital shield is always shielding you!' },
      { id: 'bunny_idle_2', text: 'PBKDF2 and AES-256 protect your keys round the clock.' },
      { id: 'bunny_idle_3', text: 'My ears are sharp, no shoulder surfers can peek here.' },
      { id: 'bunny_idle_4', text: 'Local cryptography, zero cloud reliance.' },
      { id: 'bunny_idle_5', text: 'Protecting your privacy is my number one mission.' },
      { id: 'bunny_idle_6', text: 'Checking vault integrity, all systems operating perfectly!' },
    ],
    COPIED: [
      { id: 'bunny_copy_1', text: 'Copy successful! The digital shield protects your session.' },
      { id: 'bunny_copy_2', text: 'Code safely placed into clipboard!' },
      { id: 'bunny_copy_3', text: 'Code delivered securely, enjoy safe browsing!' },
      { id: 'bunny_copy_4', text: 'Success! Paste before the 30-second window closes.' },
      { id: 'bunny_copy_5', text: 'Copied! Verified character by character.' },
    ],
    WARNING: [
      { id: 'bunny_warn_1', text: 'Window closing! Hurry to copy your code!' },
      { id: 'bunny_warn_2', text: 'Warning: Remaining validity measured in seconds!' },
      { id: 'bunny_warn_3', text: 'Ring is about to complete its loop, act fast!' },
      { id: 'bunny_warn_4', text: 'Just moments left, prepare for the next code!' },
      { id: 'bunny_warn_5', text: 'Tick tock! The code expires in moments!' },
    ],
    EMPTY: [
      { id: 'bunny_empty_1', text: 'Shield is raised and ready, but vault has no data yet!' },
      { id: 'bunny_empty_2', text: 'Add your first account so I can start protecting you.' },
      { id: 'bunny_empty_3', text: 'Tap [+] to activate your 2FA shield today!' },
      { id: 'bunny_empty_4', text: 'A secure digital life begins with your first QR code.' },
    ],
    TIPS: [
      { id: 'bunny_tip_1', text: 'Shield Bunny tip: Remember to export an encrypted .simpleotp backup!', actionText: 'Open Pet Academy' },
      { id: 'bunny_tip_2', text: 'Remember: Simple OTP runs 100% offline, data never leaves your device.', actionText: 'Open Pet Academy' },
      { id: 'bunny_tip_3', text: 'Shield Bunny tip: HOTP rotates on tap, while TOTP rotates every 30s!', actionText: 'Open Pet Academy' },
      { id: 'bunny_tip_4', text: 'Want to master security secrets? Open Pet Academy with me!', actionText: 'Open Pet Academy' },
    ],
  },
};
