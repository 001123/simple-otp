import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X, Camera, Image, ClipboardPaste, SquarePen, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { BrandColors, SemanticColors } from '@/constants/theme';

export interface IngestionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onSelectClipboard: () => void;
  onSelectManual: () => void;
  testID?: string;
}

export function IngestionSheet({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
  onSelectClipboard,
  onSelectManual,
  testID = 'ingestion-sheet',
}: IngestionSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      testID={testID}
      accessibilityLabel={t('ingestion.sheetTitle')}
    >
      <Pressable style={styles.overlay} onPress={onClose} testID={`${testID}-backdrop`}>
        <Pressable
          style={[styles.sheetContainer, { backgroundColor: theme.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Drag Handle Bar */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>
                {t('ingestion.sheetTitle')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {t('ingestion.sheetSubtitle')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
              accessibilityLabel={t('common.close')}
              testID={`${testID}-close`}
            >
              <X size={20} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Channel Action List */}
          <View style={styles.channelList}>
            {/* Channel 1: Camera QR */}
            <TouchableOpacity
              style={[styles.channelItem, { backgroundColor: theme.backgroundElement }]}
              onPress={() => {
                onClose();
                onSelectCamera();
              }}
              testID={`${testID}-option-camera`}
              accessibilityRole="button"
              accessibilityLabel={t('ingestion.cameraOption')}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(247, 107, 0, 0.12)' }]}>
                <Camera size={24} color={BrandColors.primary} strokeWidth={2} />
              </View>
              <View style={styles.channelContent}>
                <Text style={[styles.channelTitle, { color: theme.text }]}>
                  {t('ingestion.cameraOption')}
                </Text>
                <Text style={[styles.channelDescription, { color: theme.textSecondary }]}>
                  {t('ingestion.cameraDesc')}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>

            {/* Channel 2: Gallery QR */}
            <TouchableOpacity
              style={[styles.channelItem, { backgroundColor: theme.backgroundElement }]}
              onPress={() => {
                onClose();
                onSelectGallery();
              }}
              testID={`${testID}-option-gallery`}
              accessibilityRole="button"
              accessibilityLabel={t('ingestion.galleryOption')}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 199, 89, 0.12)' }]}>
                <Image size={24} color={SemanticColors.success} strokeWidth={2} />
              </View>
              <View style={styles.channelContent}>
                <Text style={[styles.channelTitle, { color: theme.text }]}>
                  {t('ingestion.galleryOption')}
                </Text>
                <Text style={[styles.channelDescription, { color: theme.textSecondary }]}>
                  {t('ingestion.galleryDesc')}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>

            {/* Channel 3: Clipboard */}
            <TouchableOpacity
              style={[styles.channelItem, { backgroundColor: theme.backgroundElement }]}
              onPress={() => {
                onClose();
                onSelectClipboard();
              }}
              testID={`${testID}-option-clipboard`}
              accessibilityRole="button"
              accessibilityLabel={t('ingestion.clipboardOption')}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 149, 0, 0.12)' }]}>
                <ClipboardPaste size={24} color={SemanticColors.warning} strokeWidth={2} />
              </View>
              <View style={styles.channelContent}>
                <Text style={[styles.channelTitle, { color: theme.text }]}>
                  {t('ingestion.clipboardOption')}
                </Text>
                <Text style={[styles.channelDescription, { color: theme.textSecondary }]}>
                  {t('ingestion.clipboardDesc')}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>

            {/* Channel 4: Manual Input */}
            <TouchableOpacity
              style={[styles.channelItem, { backgroundColor: theme.backgroundElement }]}
              onPress={() => {
                onClose();
                onSelectManual();
              }}
              testID={`${testID}-option-manual`}
              accessibilityRole="button"
              accessibilityLabel={t('ingestion.manualOption')}
            >
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                <SquarePen size={24} color="#8B5CF6" strokeWidth={2} />
              </View>
              <View style={styles.channelContent}>
                <Text style={[styles.channelTitle, { color: theme.text }]}>
                  {t('ingestion.manualOption')}
                </Text>
                <Text style={[styles.channelDescription, { color: theme.textSecondary }]}>
                  {t('ingestion.manualDesc')}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <SafeAreaView edges={['bottom']} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    width: 38,
    height: 4.5,
    backgroundColor: '#9CA3AF',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    maxWidth: 280,
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  channelList: {
    gap: 12,
    marginBottom: 16,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconEmoji: {
    fontSize: 22,
  },
  channelContent: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 15.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  channelDescription: {
    fontSize: 12.5,
    lineHeight: 16,
  },
  channelChevron: {
    fontSize: 16,
    marginLeft: 8,
    opacity: 0.4,
  },
});
