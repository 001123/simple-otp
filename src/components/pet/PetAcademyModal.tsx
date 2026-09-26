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
import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  X,
  Clock,
  AlertTriangle,
  Lightbulb,
  Info,
  ShieldCheck,
  Lock,
  ChevronLeft,
  ChevronRight,
  Check,
  Cat,
  Dog,
  Rabbit,
  PawPrint,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BrandColors, SemanticColors } from '@/constants/theme';
import { getAcademyLessons } from '@/services/pet/petAcademyData';
import type { AcademyLesson, PetAcademyModalProps } from '@/types/pet';

export function PetAcademyModal({
  visible,
  onClose,
  initialLessonId = 'lesson-1',
  activePetId: _activePetId = 'cipher-cat',
}: PetAcademyModalProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<number | null>(null);

  const lessons = getAcademyLessons(i18n.language);

  useEffect(() => {
    if (initialLessonId) {
      const idx = lessons.findIndex((l) => l.id === initialLessonId);
      if (idx !== -1) {
        setSelectedLessonIndex(idx);
        setQuizAnswerSelected(null);
      }
    }
  }, [initialLessonId, visible, lessons]);

  const currentLesson: AcademyLesson = lessons[selectedLessonIndex] || lessons[0];

  const handleSelectLesson = (index: number) => {
    setSelectedLessonIndex(index);
    setQuizAnswerSelected(null);
  };

  const handleNext = () => {
    if (selectedLessonIndex < lessons.length - 1) {
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

  const renderCalloutIcon = (icon?: string) => {
    switch (icon) {
      case 'warning':
        return <AlertTriangle size={16} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2} />;
      case 'tip':
        return <Lightbulb size={16} color={isDark ? '#34C759' : SemanticColors.success} strokeWidth={2} />;
      case 'shield':
        return <ShieldCheck size={16} color={BrandColors.primary} strokeWidth={2} />;
      case 'lock':
        return <Lock size={16} color={BrandColors.primary} strokeWidth={2} />;
      case 'info':
      default:
        return <Info size={16} color={isDark ? '#F88100' : BrandColors.primary} strokeWidth={2} />;
    }
  };

  const getCalloutStyles = (type?: string) => {
    switch (type) {
      case 'warning':
        return {
          container: {
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
            borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'transparent',
            borderWidth: isDark ? 1 : 0,
          },
          titleColor: isDark ? '#FDE68A' : '#92400E',
          textColor: isDark ? '#FEF3C7' : '#78350F',
        };
      case 'tip':
        return {
          container: {
            backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#ECFDF5',
            borderColor: isDark ? 'rgba(52, 199, 89, 0.35)' : 'transparent',
            borderWidth: isDark ? 1 : 0,
          },
          titleColor: isDark ? '#A7F3D0' : '#065F46',
          textColor: isDark ? '#D1FAE5' : '#064E3B',
        };
      case 'info':
      default:
        return {
          container: {
            backgroundColor: isDark ? 'rgba(247, 107, 0, 0.16)' : 'rgba(247, 107, 0, 0.08)',
            borderColor: isDark ? 'rgba(247, 107, 0, 0.35)' : 'rgba(247, 107, 0, 0.15)',
            borderWidth: 1,
          },
          titleColor: isDark ? '#FDBA74' : '#C2410C',
          textColor: isDark ? '#FED7AA' : '#9A3412',
        };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      accessibilityLabel={t('academy.modalTitle')}
      testID="pet-academy-modal"
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top', 'bottom', 'left', 'right']}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerTitleRow}>
              <GraduationCap size={22} color={BrandColors.primary} strokeWidth={2} style={{ marginRight: 8 }} />
              <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                {t('academy.modalTitle')}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={2}>
              {t('academy.modalSubtitle')}
            </Text>
          </View>

          <TouchableOpacity
            testID="pet-academy-close-button"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={theme.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

          {/* Lesson Tab Bar */}
          <View style={styles.tabBar}>
            {lessons.map((lesson, idx) => {
              const isActive = idx === selectedLessonIndex;
              return (
                <TouchableOpacity
                  key={lesson.id}
                  testID={`pet-academy-tab-${idx + 1}`}
                  onPress={() => handleSelectLesson(idx)}
                  style={[
                    styles.tabItem,
                    {
                      backgroundColor: isActive ? BrandColors.primary : theme.backgroundElement,
                    },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${t('academy.lessonLabel', { index: idx + 1 })}: ${lesson.title}`}
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
                    {t('academy.lessonLabel', { index: idx + 1 })}
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
              <View style={styles.narratorAvatarContainer}>
                {currentLesson.mascotId === 'cipher-cat' ? (
                  <Cat size={24} color={BrandColors.primary} strokeWidth={2} />
                ) : currentLesson.mascotId === 'byte-dog' ? (
                  <Dog size={24} color={BrandColors.primary} strokeWidth={2} />
                ) : currentLesson.mascotId === 'shield-bunny' ? (
                  <Rabbit size={24} color={BrandColors.primary} strokeWidth={2} />
                ) : (
                  <PawPrint size={24} color={BrandColors.primary} strokeWidth={2} />
                )}
              </View>
              <View style={styles.narratorInfo}>
                <View style={styles.narratorTitleRow}>
                  <Text style={[styles.narratorName, { color: theme.text }]}>
                    {currentLesson.mascotName}
                  </Text>
                  <View style={styles.readingTimeRow}>
                    <Clock size={12} color={theme.textSecondary} strokeWidth={2} style={{ marginRight: 4 }} />
                    <Text style={[styles.readingTime, { color: theme.textSecondary }]}>
                      {currentLesson.readingTime}
                    </Text>
                  </View>
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

                {section.callout && (() => {
                  const calloutStyle = getCalloutStyles(section.callout.type);
                  return (
                    <View style={[styles.calloutBox, calloutStyle.container]}>
                      <View style={styles.calloutHeader}>
                        {renderCalloutIcon(section.callout.icon)}
                        {section.callout.title && (
                          <Text style={[styles.calloutTitle, { color: calloutStyle.titleColor }]}>
                            {section.callout.title}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.calloutText, { color: calloutStyle.textColor }]}>
                        {section.callout.text}
                      </Text>
                    </View>
                  );
                })()}

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
            <View
              style={[
                styles.proTipCard,
                {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : undefined,
                  borderWidth: isDark ? 1 : 0,
                  borderLeftWidth: 4,
                  borderLeftColor: '#F59E0B',
                },
              ]}
            >
              <Text style={[styles.proTipTitle, { color: isDark ? '#FDE68A' : '#D97706' }]}>
                {t('academy.proTipTitle')}
              </Text>
              <Text style={[styles.proTipContent, { color: isDark ? '#FEF3C7' : '#92400E' }]}>
                {currentLesson.proTip}
              </Text>
            </View>

            {/* Takeaway Box */}
            <View style={[styles.takeawayCard, { borderColor: BrandColors.primary, backgroundColor: theme.backgroundElement }]}>
              <Text style={styles.takeawayTitle}>{t('academy.takeawayTitle')}</Text>
              <Text style={[styles.takeawayContent, { color: theme.text }]}>
                {currentLesson.takeaway}
              </Text>
            </View>

            {/* Mini-Quiz */}
            <View style={[styles.quizCard, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.quizHeading, { color: theme.textSecondary }]}>
                {t('academy.quizHeading')}
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
                  optionBorderColor = opt.isCorrect ? SemanticColors.success : SemanticColors.urgent;
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
                        {
                          color: isSelected
                            ? opt.isCorrect
                              ? '#065F46'
                              : '#991B1B'
                            : theme.text,
                          fontWeight: isSelected ? '600' : '400',
                        },
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
                      ? t('academy.quizCorrectFeedback')
                      : t('academy.quizIncorrectFeedback')}
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
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                },
              ]}
              accessibilityLabel={t('academy.prevLesson')}
            >
              <ChevronLeft size={16} color={theme.text} strokeWidth={2} />
              <Text style={[styles.navButtonText, { color: theme.text }]}>
                {t('academy.prevLesson')}
              </Text>
            </TouchableOpacity>

            <View style={styles.dotIndicatorRow}>
              {lessons.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.indicatorDot,
                    {
                      backgroundColor:
                        idx === selectedLessonIndex ? BrandColors.primary : theme.textSecondary,
                      width: idx === selectedLessonIndex ? 16 : 6,
                    },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              testID="pet-academy-next-button"
              onPress={handleNext}
              style={[
                styles.navButton,
                {
                  backgroundColor: BrandColors.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                },
              ]}
              accessibilityLabel={
                selectedLessonIndex === lessons.length - 1
                  ? t('academy.finishLesson')
                  : t('academy.nextLesson')
              }
            >
              {selectedLessonIndex === lessons.length - 1 ? (
                <>
                  <Check size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text style={[styles.navButtonText, { color: '#ffffff', fontWeight: '700' }]}>
                    {t('academy.finishLesson')}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.navButtonText, { color: '#ffffff', fontWeight: '700' }]}>
                    {t('academy.nextLesson')}
                  </Text>
                  <ChevronRight size={16} color="#ffffff" strokeWidth={2} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  narratorAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(60, 135, 247, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
  readingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: 'rgba(247, 107, 0, 0.1)',
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
    backgroundColor: BrandColors.primary,
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
    color: BrandColors.primary,
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
