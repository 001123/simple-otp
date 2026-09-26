# Backup & Recovery

Because Simple OTP is **100% offline**, it does not use automatic cloud synchronization. To protect your accounts against device loss or damage, you should regularly create encrypted backups.

## The `.simpleotp` Container

Simple OTP uses an encrypted file format with the `.simpleotp` extension. It bundles:
- `version`: Container format version (currently `2`).
- `salt`: Hex-encoded 16-byte random salt for PBKDF2.
- `iv`: Hex-encoded 12-byte initialization vector.
- `tag`: Hex-encoded 16-byte authentication tag for AES-GCM integrity.
- `data`: Hex-encoded ciphertext containing the serialized 2FA accounts.

---

## Exporting a Backup

1. Open **Simple OTP** and tap the **Settings** icon.
2. Select **Export Encrypted Backup**.
3. Enter and confirm a strong passphrase.
4. Tap **Export**. The system share sheet appears, allowing you to:
   - Save to the Files app (iCloud Drive / Local Storage).
   - AirDrop to another trusted device.
   - Send to your secure cloud storage provider.

> [!IMPORTANT]
> Simple OTP cannot recover your backup if you forget your passphrase. There is no backdoor, master reset, or account recovery server.

---

## Restoring from a Backup

1. On your new or restored device, open **Simple OTP**.
2. Tap the **Settings** icon -> **Import Backup**.
3. Select your `.simpleotp` file using the native document picker.
4. Enter the passphrase you chose during export.
5. Tap **Restore**. 

The app decrypts the file, validates the cryptographic integrity tag, and imports your accounts into the local secure vault.
