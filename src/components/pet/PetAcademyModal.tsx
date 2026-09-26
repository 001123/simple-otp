import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { ACADEMY_LESSONS } from '@/services/pet/petAcademyData';
import type { AcademyLesson, PetAcademyModalProps } from '@/types/pet';

export function PetAcademyModal({
  visible,
  onClose,
  initialLessonId = 'lesson-1',
  activePetId: _activePetId = 'cipher-cat',
}: PetAcademyModalProps) {
  const theme = useTheme();
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<number | null>(null);

  useEffect(() => {
    if (initialLessonId) {
      const idx = ACADEMY_LESSONS.findIndex((l) => l.id === initialLessonId);
      if (idx !== -1) {
        setSelectedLessonIndex(idx);
        setQuizAnswerSelected(null);
      }
    }
  }, [initialLessonId, visible]);

  const currentLesson: AcademyLesson = ACADEMY_LESSONS[selectedLessonIndex] || ACADEMY_LESSONS[0];

  const handleSelectLesson = (index: number) => {
    setSelectedLessonIndex(index);
    setQuizAnswerSelected(null);
  };

  const handleNext = () => {
    if (selectedLessonIndex < ACADEMY_LESSONS.length - 1) {
      setSelectedLessonIndex((prev) => prev + 1);
      setQuizAnswerSelected(null);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (selectedLessonIndex > 0) {
      setSelectedLessonIndex((prev) => prev - 1);
      setQuizAnswerSelected(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      accessibilityLabel="Pet Academy Modal"
      testID="pet-academy-modal"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.sheetContainer, { backgroundColor: theme.background }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>🎓 Pet Academy</Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Bài {currentLesson.index} / {ACADEMY_LESSONS.length} • {currentLesson.badge}
              </Text>
            </View>

            <TouchableOpacity
              testID="pet-academy-close-button"
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng Pet Academy"
              style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
            >
              <Text style={[styles.closeButtonText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Lesson Tab Bar */}
          <View style={styles.tabBar}>
            {ACADEMY_LESSONS.map((lesson, idx) => {
              const isActive = idx === selectedLessonIndex;
              return (
                <TouchableOpacity
                  key={lesson.id}
                  testID={`pet-academy-tab-${idx + 1}`}
                  onPress={() => handleSelectLesson(idx)}
                  style={[
                    styles.tabItem,
                    {
                      backgroundColor: isActive ? '#3c87f7' : theme.backgroundElement,
                    },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Bài ${idx + 1}: ${lesson.title}`}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: isActive ? '#ffffff' : theme.textSecondary,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                  >
                    Bài {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Scrollable Lesson Content */}
          <ScrollView
            testID="pet-academy-scroll"
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Narrator Banner */}
            <View style={[styles.narratorCard, { backgroundColor: theme.backgroundElement }]}>
              <Text style={styles.narratorAvatar}>{currentLesson.mascotEmoji}</Text>
              <View style={styles.narratorInfo}>
                <View style={styles.narratorTitleRow}>
                  <Text style={[styles.narratorName, { color: theme.text }]}>
                    {currentLesson.mascotName}
                  </Text>
                  <Text style={[styles.readingTime, { color: theme.textSecondary }]}>
                    ⏱️ {currentLesson.readingTime}
                  </Text>
                </View>
                <Text style={[styles.narratorSpeech, { color: theme.textSecondary }]}>
                  {`"${currentLesson.introQuote}"`}
                </Text>
              </View>
            </View>

            {/* Title & Subtitle */}
            <View style={styles.titleSection}>
              <Text style={[styles.lessonTitle, { color: theme.text }]}>
                {currentLesson.title}
              </Text>
              <Text style={[styles.lessonSubtitle, { color: theme.textSecondary }]}>
                {currentLesson.subtitle}
              </Text>
            </View>

            {/* Sections */}
            {currentLesson.sections.map((section, sIdx) => (
              <View key={sIdx} style={styles.sectionBlock}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {section.title}
                </Text>
                <Text style={[styles.sectionContent, { color: theme.text }]}>
                  {section.content}
                </Text>

                {section.callout && (
                  <View
                    style={[
                      styles.calloutBox,
                      section.callout.type === 'warning'
                        ? styles.calloutWarning
                        : section.callout.type === 'tip'
                        ? styles.calloutTip
                        : styles.calloutInfo,
                    ]}
                  >
                    <View style={styles.calloutHeader}>
                      <Text style={styles.calloutIcon}>{section.callout.icon || '💡'}</Text>
                      {section.callout.title && (
                        <Text style={styles.calloutTitle}>{section.callout.title}</Text>
                      )}
                    </View>
                    <Text style={styles.calloutText}>{section.callout.text}</Text>
                  </View>
                )}

                {section.diagram?.items && (
                  <View style={[styles.diagramBox, { backgroundColor: theme.backgroundElement }]}>
                    <Text style={[styles.diagramCaption, { color: theme.textSecondary }]}>
                      {section.diagram.caption}
                    </Text>
                    {section.diagram.items.map((item, dIdx) => (
                      <View key={dIdx} style={styles.diagramItemRow}>
                        <View style={styles.diagramBadge}>
                          <Text style={styles.diagramBadgeText}>{item.label}</Text>
                        </View>
                        <Text style={[styles.diagramItemDesc, { color: theme.text }]}>
                          {item.description}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* Pro-Tip Box */}
            <View style={styles.proTipCard}>
              <Text style={styles.proTipTitle}>🌟 Mẹo từ linh vật</Text>
              <Text style={styles.proTipContent}>{currentLesson.proTip}</Text>
            </View>

            {/* Takeaway Box */}
            <View style={[styles.takeawayCard, { borderColor: '#3c87f7', backgroundColor: theme.backgroundElement }]}>
              <Text style={styles.takeawayTitle}>📌 Bài học cốt lõi</Text>
              <Text style={[styles.takeawayContent, { color: theme.text }]}>
                {currentLesson.takeaway}
              </Text>
            </View>

            {/* Mini-Quiz */}
            <View style={[styles.quizCard, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.quizHeading, { color: theme.textSecondary }]}>
                🎯 CÂU HỎI NHANH
              </Text>
              <Text style={[styles.quizQuestion, { color: theme.text }]}>
                {currentLesson.quiz.question}
              </Text>

              {currentLesson.quiz.options.map((opt, optIdx) => {
                const isSelected = quizAnswerSelected === optIdx;
                let optionBgColor: string = theme.background;
                let optionBorderColor: string = theme.backgroundSelected;

                if (isSelected) {
                  optionBgColor = opt.isCorrect ? '#D1FAE5' : '#FEE2E2';
                  optionBorderColor = opt.isCorrect ? '#10B981' : '#EF4444';
                }

                return (
                  <TouchableOpacity
                    key={optIdx}
                    testID={`quiz-option-${optIdx}`}
                    style={[
                      styles.quizOptionButton,
                      {
                        backgroundColor: optionBgColor,
                        borderColor: optionBorderColor,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => setQuizAnswerSelected(optIdx)}
                  >
                    <Text
                      style={[
                        styles.quizOptionText,
                        { color: isSelected && opt.isCorrect ? '#065F46' : theme.text },
                      ]}
                    >
                      {String.fromCharCode(65 + optIdx)}. {opt.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {quizAnswerSelected !== null && (
                <View
                  testID="quiz-feedback"
                  style={[
                    styles.quizFeedback,
                    {
                      backgroundColor:
                        currentLesson.quiz.options[quizAnswerSelected].isCorrect
                          ? '#D1FAE5'
                          : '#FEE2E2',
                    },
                  ]}
                >
                  <Text style={styles.quizFeedbackText}>
                    {currentLesson.quiz.options[quizAnswerSelected].isCorrect
                      ? '🎉 Chính xác tuyệt đối!'
                      : '💡 Chưa đúng rồi, thử lại nhé!'}
                  </Text>
                  <Text style={styles.quizExplanation}>
                    {currentLesson.quiz.explanation}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Navigation Controls */}
          <View style={[styles.footerBar, { borderTopColor: theme.backgroundElement }]}>
            <TouchableOpacity
              testID="pet-academy-prev-button"
              onPress={handlePrev}
              disabled={selectedLessonIndex === 0}
              style={[
                styles.navButton,
                {
                  opacity: selectedLessonIndex === 0 ? 0.4 : 1,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
              accessibilityLabel="Bài học trước"
            >
              <Text style={[styles.navButtonText, { color: theme.text }]}>◀ Bài trước</Text>
            </TouchableOpacity>

            <View style={styles.dotIndicatorRow}>
              {ACADEMY_LESSONS.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.indicatorDot,
                    {
                      backgroundColor:
                        idx === selectedLessonIndex ? '#3c87f7' : theme.textSecondary,
                      width: idx === selectedLessonIndex ? 16 : 6,
                    },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              testID="pet-academy-next-button"
              onPress={handleNext}
              style={[styles.navButton, { backgroundColor: '#3c87f7' }]}
              accessibilityLabel={
                selectedLessonIndex === ACADEMY_LESSONS.length - 1
                  ? 'Hoàn thành bài học'
                  : 'Bài học tiếp theo'
              }
            >
              <Text style={[styles.navButtonText, { color: '#ffffff', fontWeight: '700' }]}>
                {selectedLessonIndex === ACADEMY_LESSONS.length - 1 ? 'Xong 🎓' : 'Tiếp theo ▶'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
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
    maxHeight: '90%',
    minHeight: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#8E8E93',
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 24,
    gap: 16,
  },
  narratorCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  narratorAvatar: {
    fontSize: 36,
  },
  narratorInfo: {
    flex: 1,
  },
  narratorTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  narratorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  readingTime: {
    fontSize: 12,
  },
  narratorSpeech: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  titleSection: {
    gap: 4,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  lessonSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 21,
  },
  calloutBox: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
    marginTop: 4,
  },
  calloutWarning: {
    backgroundColor: '#FEF3C7',
  },
  calloutTip: {
    backgroundColor: '#ECFDF5',
  },
  calloutInfo: {
    backgroundColor: '#EFF6FF',
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calloutIcon: {
    fontSize: 16,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  calloutText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
  },
  diagramBox: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
  },
  diagramCaption: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  diagramItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  diagramBadge: {
    backgroundColor: '#3c87f7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diagramBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  diagramItemDesc: {
    fontSize: 13,
    flex: 1,
  },
  proTipCard: {
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    gap: 6,
  },
  proTipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  proTipContent: {
    fontSize: 13,
    lineHeight: 19,
    color: '#92400E',
  },
  takeawayCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  takeawayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  takeawayContent: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  quizCard: {
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  quizHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  quizQuestion: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  quizOptionButton: {
    padding: 12,
    borderRadius: 10,
  },
  quizOptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  quizFeedback: {
    padding: 12,
    borderRadius: 10,
    gap: 4,
    marginTop: 6,
  },
  quizFeedbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  quizExplanation: {
    fontSize: 12,
    lineHeight: 17,
    color: '#374151',
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  navButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dotIndicatorRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  indicatorDot: {
    height: 6,
    borderRadius: 3,
  },
});
