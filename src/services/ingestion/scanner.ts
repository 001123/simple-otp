/**
 * QR Scanner & Gallery Ingestion Service
 *
 * Implements camera barcode handling with atomic frame locking,
 * offline photo library QR decoding, and permission lifecycle management.
 */

import { Camera, scanFromURLAsync, type BarcodeScanningResult, type BarcodeSettings, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { parseOtpAuthUri } from '@/services/otp/uriParser';
import type { ParsedOtpAuthUri } from '@/types/otp';

export type ScannerErrorCode =
  | 'PERMISSION_DENIED_CAMERA'
  | 'PERMISSION_DENIED_MEDIA_LIBRARY'
  | 'PICKER_CANCELED'
  | 'NO_QR_FOUND'
  | 'INVALID_URI_SCHEME'
  | 'URI_PARSE_ERROR'
  | 'SCANNER_LOCKED'
  | 'DECODE_ENGINE_ERROR';

export class ScannerError extends Error {
  readonly code: ScannerErrorCode;
  readonly userMessage: string;
  readonly originalError?: unknown;

  constructor(code: ScannerErrorCode, message: string, userMessage: string, originalError?: unknown) {
    super(message);
    this.name = 'ScannerError';
    this.code = code;
    this.userMessage = userMessage;
    this.originalError = originalError;
  }
}

export interface ScannerScanResult {
  rawUri: string;
  account: ParsedOtpAuthUri;
}

export interface GalleryPickerResult {
  canceled: boolean;
  result?: ScannerScanResult;
  error?: ScannerError;
}

export interface CameraPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface MediaLibraryPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface QrDecoderEngine {
  decodeFromUri(imageUri: string): Promise<string[]>;
}

export const SCANNER_BARCODE_SETTINGS: BarcodeSettings = {
  barcodeTypes: ['qr'],
};

export const SCANNER_DEFAULTS = {
  facing: 'back' as CameraType,
  enableTorch: false,
  cooldownMs: 1500,
  imagePickerQuality: 1.0,
} as const;

export const SCANNER_MESSAGES = {
  vi: {
    CAMERA_PERMISSION_DENIED: 'Simple OTP cần quyền truy cập máy ảnh để quét mã QR.',
    MEDIA_LIBRARY_PERMISSION_DENIED: 'Simple OTP cần quyền truy cập thư viện ảnh để quét mã QR.',
    NO_QR_FOUND: 'Không tìm thấy mã QR trong hình ảnh đã chọn. Vui lòng thử lại với hình ảnh rõ nét hơn.',
    INVALID_URI_SCHEME: 'Mã QR không phải mã cấu hình 2FA (phải bắt đầu bằng otpauth://).',
    URI_PARSE_ERROR: 'Mã QR chứa cấu hình không hợp lệ hoặc khoá Base32 bị lỗi.',
    PERMISSION_SETTINGS_HINT: 'Vui lòng mở Cài đặt hệ thống để cấp quyền cho Simple OTP.',
  },
  en: {
    CAMERA_PERMISSION_DENIED: 'Simple OTP needs camera access to scan QR codes.',
    MEDIA_LIBRARY_PERMISSION_DENIED: 'Simple OTP needs photo library access to scan QR codes.',
    NO_QR_FOUND: 'No QR code was detected in the selected image. Please try a clearer image.',
    INVALID_URI_SCHEME: 'Scanned QR code is not a 2FA configuration (must start with otpauth://).',
    URI_PARSE_ERROR: 'QR code contains invalid configuration parameters or corrupt Base32 secret.',
    PERMISSION_SETTINGS_HINT: 'Please open system settings to grant permissions for Simple OTP.',
  },
} as const;

export class ScanLockController {
  private _isLocked = false;
  private _cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly cooldownMs: number;

  constructor(cooldownMs: number = SCANNER_DEFAULTS.cooldownMs) {
    this.cooldownMs = cooldownMs;
  }

  get isLocked(): boolean {
    return this._isLocked;
  }

  /**
   * Synchronously attempts to acquire the lock.
   * Returns true if lock was acquired, false if already locked.
   */
  acquireLock(): boolean {
    if (this._isLocked) return false;
    this._isLocked = true;
    return true;
  }

  /**
   * Releases lock immediately.
   */
  unlock(): void {
    if (this._cooldownTimer) {
      clearTimeout(this._cooldownTimer);
      this._cooldownTimer = null;
    }
    this._isLocked = false;
  }

  /**
   * Locks and sets a cooldown timer to automatically unlock after cooldownMs.
   */
  lockWithCooldown(onUnlock?: () => void): void {
    this._isLocked = true;
    if (this._cooldownTimer) {
      clearTimeout(this._cooldownTimer);
    }
    this._cooldownTimer = setTimeout(() => {
      this._isLocked = false;
      this._cooldownTimer = null;
      onUnlock?.();
    }, this.cooldownMs);
  }

  reset(): void {
    this.unlock();
  }
}

export interface HandleBarcodeScanOptions {
  lockController: ScanLockController;
  onSuccess: (result: ScannerScanResult) => void;
  onError?: (error: ScannerError) => void;
  enableHaptics?: boolean;
}

export function handleBarcodeScan(
  result: BarcodeScanningResult,
  options: HandleBarcodeScanOptions
): boolean {
  const { lockController, onSuccess, onError, enableHaptics = true } = options;

  // 1. Synchronous Lock Check
  if (!lockController.acquireLock()) {
    return false;
  }

  const rawData = result.data?.trim();
  if (!rawData) {
    lockController.lockWithCooldown();
    return false;
  }

  // 2. URI Scheme Validation
  if (!rawData.toLowerCase().startsWith('otpauth://')) {
    const error = new ScannerError(
      'INVALID_URI_SCHEME',
      `Invalid QR code scheme: "${rawData.slice(0, 30)}..."`,
      SCANNER_MESSAGES.vi.INVALID_URI_SCHEME
    );
    if (enableHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    lockController.lockWithCooldown();
    onError?.(error);
    return false;
  }

  // 3. Complete URI Parsing & Base32 Validation
  try {
    const account = parseOtpAuthUri(rawData);
    if (enableHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    // Retain lock so user can confirm account in UI sheet
    onSuccess({ rawUri: rawData, account });
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = new ScannerError(
      'URI_PARSE_ERROR',
      `Failed to parse otpauth URI: ${message}`,
      SCANNER_MESSAGES.vi.URI_PARSE_ERROR,
      err
    );
    if (enableHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    lockController.lockWithCooldown();
    onError?.(error);
    return false;
  }
}

export class NativeCameraQrDecoder implements QrDecoderEngine {
  async decodeFromUri(imageUri: string): Promise<string[]> {
    try {
      const results = await scanFromURLAsync(imageUri, ['qr']);
      return results
        .map((r) => r.data?.trim())
        .filter((data): data is string => typeof data === 'string' && data.length > 0);
    } catch (err: unknown) {
      throw new ScannerError(
        'DECODE_ENGINE_ERROR',
        `Native barcode scanner failed on image URI: ${err}`,
        SCANNER_MESSAGES.vi.NO_QR_FOUND,
        err
      );
    }
  }
}

export const defaultQrDecoder = new NativeCameraQrDecoder();

export interface PickAndScanGalleryOptions {
  decoder?: QrDecoderEngine;
  enableHaptics?: boolean;
}

export async function pickAndScanGalleryQr(
  options: PickAndScanGalleryOptions = {}
): Promise<GalleryPickerResult> {
  const { decoder = defaultQrDecoder, enableHaptics = true } = options;

  // 1. Launch System Image Library Picker with Strict Offline Settings
  let pickerResult: ImagePicker.ImagePickerResult;
  try {
    pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: SCANNER_DEFAULTS.imagePickerQuality,
      shouldDownloadFromNetwork: false, // ZERO-NETWORK INVARIANT
    });
  } catch (err: unknown) {
    throw new ScannerError(
      'PERMISSION_DENIED_MEDIA_LIBRARY',
      `Image picker failed: ${err}`,
      SCANNER_MESSAGES.vi.MEDIA_LIBRARY_PERMISSION_DENIED,
      err
    );
  }

  // 2. Handle User Cancellation
  if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
    return { canceled: true };
  }

  const selectedAsset = pickerResult.assets[0];
  const imageUri = selectedAsset.uri;

  // 3. Decode QR Codes from Image File URL
  const qrStrings = await decoder.decodeFromUri(imageUri);

  if (qrStrings.length === 0) {
    const error = new ScannerError(
      'NO_QR_FOUND',
      'No QR codes detected in selected gallery image.',
      SCANNER_MESSAGES.vi.NO_QR_FOUND
    );
    if (enableHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    return { canceled: false, error };
  }

  // 4. Find first valid otpauth:// QR code
  const otpauthCandidate = qrStrings.find((s) => s.toLowerCase().startsWith('otpauth://'));

  if (!otpauthCandidate) {
    const error = new ScannerError(
      'INVALID_URI_SCHEME',
      `Image contains QR code, but not otpauth:// scheme: "${qrStrings[0].slice(0, 30)}..."`,
      SCANNER_MESSAGES.vi.INVALID_URI_SCHEME
    );
    if (enableHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    return { canceled: false, error };
  }

  // 5. Parse and Validate Account
  try {
    const account = parseOtpAuthUri(otpauthCandidate);
    if (enableHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    return {
      canceled: false,
      result: {
        rawUri: otpauthCandidate,
        account,
      },
    };
  } catch (err: unknown) {
    const error = new ScannerError(
      'URI_PARSE_ERROR',
      `QR code contains invalid OTP configuration: ${err}`,
      SCANNER_MESSAGES.vi.URI_PARSE_ERROR,
      err
    );
    if (enableHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    return { canceled: false, error };
  }
}

export async function checkCameraPermission(): Promise<CameraPermissionState> {
  const response = await Camera.getCameraPermissionsAsync();
  return {
    granted: response.granted,
    canAskAgain: response.canAskAgain,
    status: response.status,
  };
}

export async function requestCameraPermission(): Promise<CameraPermissionState> {
  const response = await Camera.requestCameraPermissionsAsync();
  return {
    granted: response.granted,
    canAskAgain: response.canAskAgain,
    status: response.status,
  };
}

export async function checkMediaLibraryPermission(): Promise<MediaLibraryPermissionState> {
  const response = await ImagePicker.getMediaLibraryPermissionsAsync();
  return {
    granted: response.granted,
    canAskAgain: response.canAskAgain,
    status: response.status,
  };
}

export async function requestMediaLibraryPermission(): Promise<MediaLibraryPermissionState> {
  const response = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return {
    granted: response.granted,
    canAskAgain: response.canAskAgain,
    status: response.status,
  };
}
