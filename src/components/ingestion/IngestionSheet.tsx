import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      testID={testID}
      accessibilityLabel="Menu thêm tài khoản"
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
              <Text style={[styles.title, { color: theme.text }]}>Thêm tài khoản 2FA</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Chọn phương thức để nạp mã xác thực vào kho bảo mật
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
              accessibilityLabel="Đóng"
              testID={`${testID}-close`}
            >
              <Text style={[styles.closeText, { color: theme.text }]}>✕</Text>
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
              accessibilityLabel="Quét mã QR bằng Camera"
            >
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.iconEmoji}>📷</Text>
              </View>
              <View style={styles.channelContent}>
                <Text style={[styles.channelTitle, { color: theme.text }]}>
                  Quét mã QR bằng Camera
                </Text>
                <Text style={[styles.channelDescription, { color: theme.textSecondary }]}>
                  Mở máy ảnh quét mã trực tiếp từ trang đăng nhập
                </Text>
              </View>
              <Text style={[styles.channelChevron, { color: theme.textSecondary }]}>➔</Text>
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
              accessibilityLabel="Quét mã từ Thư viện ảnh"
            >
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Text style={styles.iconEmoji}>🖼️</Text>
              </View>
              <View style={styles.channelContent}>
                <Text style={[styles.channelTitle, { color: theme.text }]}>
                  Quét mã từ Thư viện ảnh
                </Text>
                <Text style={[styles.channelDescription, { color: theme.textSecondary }]}>
                  Trích xuất mã từ ảnh chụp màn hình mã QR
                </Text>
              </View>
              <Text style={[styles.channelChevron, { color: theme.textSecondary }]}>➔</Text>
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
              accessibilityLabel="Dán từ Clipboard"
            >
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.iconEmoji}>📋</Text>
              </View>
              <View style={styles.channelContent}>
                <Text style={[styles.channelTitle, { color: theme.text }]}>
                  Dán từ Clipboard
                </Text>
                <Text style={[styles.channelDescription, { color: theme.textSecondary }]}>
                  Tự động nhận diện URI hoặc khóa Base32 đã sao chép
                </Text>
              </View>
              <Text style={[styles.channelChevron, { color: theme.textSecondary }]}>➔</Text>
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
              accessibilityLabel="Nhập khoá thủ công"
            >
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                <Text style={styles.iconEmoji}>✍️</Text>
              </View>
              <View style={styles.channelContent}>
                <Text style={[styles.channelTitle, { color: theme.text }]}>
                  Nhập khoá thủ công
                </Text>
                <Text style={[styles.channelDescription, { color: theme.textSecondary }]}>
                  Điền tên tài khoản và nhập khóa bí mật Base32
                </Text>
              </View>
              <Text style={[styles.channelChevron, { color: theme.textSecondary }]}>➔</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#8E8E93',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    maxWidth: 280,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  channelList: {
    gap: 12,
    marginTop: 4,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  channelContent: {
    flex: 1,
    gap: 2,
  },
  channelTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  channelDescription: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  channelChevron: {
    fontSize: 14,
    fontWeight: '600',
  },
});
