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
import { useTranslation } from 'react-i18next';
import { X, Flashlight, CameraOff, Image as ImageIcon } from 'lucide-react-native';
import {
  ScanLockController,
  handleBarcodeScan,
  SCANNER_BARCODE_SETTINGS,
  type ScannerScanResult,
} from '@/services/ingestion/scanner';
import { BrandColors } from '@/constants/theme';

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
  const { t } = useTranslation();
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
          Alert.alert(t('ingestion.scanErrorTitle'), err.userMessage, [
            {
              text: t('common.cancel'),
              onPress: () => lockControllerRef.current.reset(),
            },
          ]);
        },
      });
    },
    [onScanSuccess, t]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      testID={testID}
      accessibilityLabel={t('ingestion.cameraOption')}
    >
      <View style={styles.container}>
        {/* Permission Loading */}
        {!permission ? (
          <View style={styles.permissionContainer} testID={`${testID}-loading`}>
            <ActivityIndicator size="large" color={BrandColors.primary} />
            <Text style={styles.permissionText}>{t('common.loading')}</Text>
          </View>
        ) : !permission.granted ? (
          /* Permission Denied UI */
          <SafeAreaView style={styles.permissionContainer} testID={`${testID}-permission-denied`}>
            <CameraOff size={56} color="#9CA3AF" strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <Text style={styles.permissionTitle}>{t('ingestion.cameraPermissionDeniedTitle')}</Text>
            <Text style={styles.permissionDescription}>
              {t('ingestion.cameraPermissionDeniedDesc')}
            </Text>

            {permission.canAskAgain ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={requestPermission}
                testID={`${testID}-grant-permission`}
              >
                <Text style={styles.primaryButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => Linking.openSettings()}
                testID={`${testID}-open-settings`}
              >
                <Text style={styles.primaryButtonText}>{t('settings.title')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{t('common.close')}</Text>
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
                    accessibilityLabel={t('ingestion.cameraClose')}
                  >
                    <X size={22} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>

                  <Text style={styles.headerTitle}>{t('ingestion.cameraOption')}</Text>

                  <TouchableOpacity
                    style={[
                      styles.headerIconButton,
                      torchEnabled && styles.headerIconButtonActive,
                    ]}
                    onPress={() => setTorchEnabled((prev) => !prev)}
                    testID={`${testID}-torch-toggle`}
                    accessibilityLabel={torchEnabled ? t('ingestion.cameraTorchOff') : t('ingestion.cameraTorchOn')}
                  >
                    <Flashlight size={22} color={torchEnabled ? '#F59E0B' : '#FFFFFF'} strokeWidth={2} />
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
                  {t('ingestion.cameraAlignHint')}
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
                    <ImageIcon size={18} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 8 }} />
                    <Text style={styles.galleryButtonText}>{t('ingestion.galleryOption')}</Text>
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
    lineHeight: 22,
    maxWidth: 320,
  },
  primaryButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'column',
  },
  topBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconButtonActive: {
    backgroundColor: '#EAB308',
  },
  headerIconText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reticleRow: {
    flexDirection: 'row',
    height: RETICLE_SIZE,
    alignItems: 'center',
  },
  sideOverlay: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  reticleFrame: {
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: BrandColors.primary,
  },
  bracketTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  bracketTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bracketBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  instructionText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
