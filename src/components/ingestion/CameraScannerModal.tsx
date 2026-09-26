import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScanLockController,
  handleBarcodeScan,
  SCANNER_BARCODE_SETTINGS,
  type ScannerScanResult,
} from '@/services/ingestion/scanner';

export interface CameraScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (result: ScannerScanResult) => void;
  onOpenGallery?: () => void;
  testID?: string;
}

export function CameraScannerModal({
  visible,
  onClose,
  onScanSuccess,
  onOpenGallery,
  testID = 'camera-scanner-modal',
}: CameraScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const lockControllerRef = useRef(new ScanLockController(1500));

  // Reset scan lock and torch state whenever modal visibility changes
  useEffect(() => {
    if (visible) {
      lockControllerRef.current.reset();
      setTorchEnabled(false);
    }
  }, [visible]);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      handleBarcodeScan(result, {
        lockController: lockControllerRef.current,
        enableHaptics: true,
        onSuccess: (scanResult) => {
          onScanSuccess(scanResult);
        },
        onError: (err) => {
          Alert.alert('Mã QR không hợp lệ', err.userMessage, [
            {
              text: 'Quét lại',
              onPress: () => lockControllerRef.current.reset(),
            },
          ]);
        },
      });
    },
    [onScanSuccess]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      testID={testID}
      accessibilityLabel="Màn hình quét mã QR"
    >
      <View style={styles.container}>
        {/* Permission Loading */}
        {!permission ? (
          <View style={styles.permissionContainer} testID={`${testID}-loading`}>
            <ActivityIndicator size="large" color="#3c87f7" />
            <Text style={styles.permissionText}>Đang khởi tạo máy ảnh...</Text>
          </View>
        ) : !permission.granted ? (
          /* Permission Denied UI */
          <SafeAreaView style={styles.permissionContainer} testID={`${testID}-permission-denied`}>
            <Text style={styles.permissionIcon}>📷</Text>
            <Text style={styles.permissionTitle}>Yêu cầu quyền truy cập máy ảnh</Text>
            <Text style={styles.permissionDescription}>
              Simple OTP cần quyền sử dụng máy ảnh để quét mã QR cấu hình 2FA trực tiếp. Mọi hình ảnh
              được xử lý 100% ngoại tuyến trên thiết bị của bạn.
            </Text>

            {permission.canAskAgain ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={requestPermission}
                testID={`${testID}-grant-permission`}
              >
                <Text style={styles.primaryButtonText}>Cấp quyền máy ảnh</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => Linking.openSettings()}
                testID={`${testID}-open-settings`}
              >
                <Text style={styles.primaryButtonText}>Mở Cài đặt hệ thống</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Đóng</Text>
            </TouchableOpacity>
          </SafeAreaView>
        ) : (
          /* Active Camera Preview with Viewfinder */
          <View style={StyleSheet.absoluteFill}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torchEnabled}
              barcodeScannerSettings={SCANNER_BARCODE_SETTINGS}
              onBarcodeScanned={handleBarcodeScanned}
            />

            {/* Viewfinder Cutout Overlay */}
            <View style={styles.overlayContainer}>
              {/* Top Dark Bar */}
              <SafeAreaView style={styles.topBar}>
                <View style={styles.headerControls}>
                  <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={onClose}
                    testID={`${testID}-close`}
                    accessibilityLabel="Đóng máy ảnh"
                  >
                    <Text style={styles.headerIconText}>✕</Text>
                  </TouchableOpacity>

                  <Text style={styles.headerTitle}>Quét mã QR</Text>

                  <TouchableOpacity
                    style={[
                      styles.headerIconButton,
                      torchEnabled && styles.headerIconButtonActive,
                    ]}
                    onPress={() => setTorchEnabled((prev) => !prev)}
                    testID={`${testID}-torch-toggle`}
                    accessibilityLabel={torchEnabled ? 'Tắt đèn pin' : 'Bật đèn pin'}
                  >
                    <Text style={styles.headerIconText}>{torchEnabled ? '🔦' : '⚡'}</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              {/* Viewfinder Reticle Row */}
              <View style={styles.reticleRow}>
                <View style={styles.sideOverlay} />
                <View style={styles.reticleFrame} testID={`${testID}-reticle`}>
                  {/* Target Bracket Reticles */}
                  <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
                  <View style={[styles.cornerBracket, styles.bracketTopRight]} />
                  <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
                  <View style={[styles.cornerBracket, styles.bracketBottomRight]} />
                </View>
                <View style={styles.sideOverlay} />
              </View>

              {/* Bottom Instructions & Secondary Action */}
              <View style={styles.bottomOverlay}>
                <Text style={styles.instructionText}>
                  Di chuyển khung ngắm vào giữa mã QR để quét
                </Text>

                {onOpenGallery && (
                  <TouchableOpacity
                    style={styles.galleryButton}
                    onPress={() => {
                      onClose();
                      onOpenGallery();
                    }}
                    testID={`${testID}-gallery-switch`}
                  >
                    <Text style={styles.galleryButtonText}>🖼️ Quét từ thư viện ảnh</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const RETICLE_SIZE = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: '#121214',
  },
  permissionIcon: {
    fontSize: 54,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  permissionText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#3c87f7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
  },
  topBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconButtonActive: {
    backgroundColor: '#F59E0B',
  },
  headerIconText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  reticleRow: {
    flexDirection: 'row',
    height: RETICLE_SIZE,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  reticleFrame: {
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  cornerBracket: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#38BDF8',
  },
  bracketTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  bracketTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bracketBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  instructionText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  galleryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
