/**
 * Domain Models & Types for Simple OTP Mascot Companion System & Pet Academy
 */

export type PetId = 'cipher-cat' | 'byte-dog' | 'shield-bunny';
export type PetState = 'IDLE' | 'COPIED' | 'WARNING' | 'EMPTY';

export interface PetCompanionProps {
  petId: PetId;
  state: PetState;
  onTap: () => void;
  speechMessage?: string | null;
  displaySize?: number; // default: 72 dp
}

export interface SpeechBubbleProps {
  visible?: boolean;
  message: string | null;
  actionText?: string | null;
  onAction?: () => void;
  onActionPress?: () => void;
  onDismiss?: () => void;
  autoDismissMs?: number;
  position?: 'left' | 'top';
  petId?: PetId;
  testID?: string;
}

export interface MascotPersonaMetadata {
  id: PetId;
  name: string;
  vietnameseName: string;
  title: string;
  description: string;
  catchphrase: string;
  signatureEmoji: string;
}

export interface PetDialogueItem {
  id: string;
  text: string;
  actionText?: string;
  mood?: 'happy' | 'urgent' | 'calm' | 'inquisitive';
}

export interface MascotDialogues {
  idle: PetDialogueItem[];
  copied: PetDialogueItem[];
  warning: PetDialogueItem[];
  empty: PetDialogueItem[];
  tips: PetDialogueItem[];
}

export interface DialogueSelectionOptions {
  previousId?: string;
  isTap?: boolean;
}

export interface MascotStateInputs {
  accountCount: number;
  isAnyTotpUrgent: boolean;
  isCopiedActive: boolean;
}

export type LessonId = 'lesson-1' | 'lesson-2' | 'lesson-3' | 'lesson-4';
export type CalloutType = 'info' | 'warning' | 'tip' | 'quote';

export interface LessonCallout {
  type: CalloutType;
  title?: string;
  text: string;
  icon?: string;
}

export interface LessonDiagram {
  type: 'credential-stuffing' | 'totp-pipeline' | 'totp-vs-hotp-table' | 'backup-checklist';
  caption: string;
  items?: { label: string; description: string }[];
}

export interface LessonSection {
  title: string;
  content: string;
  callout?: LessonCallout;
  diagram?: LessonDiagram;
}

export interface LessonQuizOption {
  text: string;
  isCorrect: boolean;
}

export interface LessonQuiz {
  question: string;
  options: LessonQuizOption[];
  explanation: string;
}

export interface AcademyLesson {
  id: LessonId;
  index: number; // 1, 2, 3, 4
  title: string;
  subtitle: string;
  badge: string;
  mascotId: PetId;
  mascotName: string;
  mascotEmoji: string;
  readingTime: string;
  introQuote: string;
  summary: string;
  sections: LessonSection[];
  proTip: string;
  takeaway: string;
  quiz: LessonQuiz;
}

// Alias for PetAcademyLesson
export type PetAcademyLesson = AcademyLesson;

export interface PetAcademyModalProps {
  visible: boolean;
  onClose: () => void;
  initialLessonId?: LessonId;
  activePetId?: PetId;
}

export interface UsePetCompanionOptions {
  accountCount?: number;
  hasUrgentTimer?: boolean; // Any TOTP card remainingSeconds <= 5
}

export interface UsePetCompanionResult {
  petId: PetId;
  petState: PetState;
  setPet: (petId: PetId) => Promise<void>;
  speechMessage: string | null;
  speechActionText?: string | null;
  isSpeechVisible: boolean;
  triggerSpeech: (customMessage?: string, timeoutMs?: number, actionText?: string | null) => void;
  triggerTap: () => void;
  dismissSpeech: () => void;
  triggerCopied: () => void;
  isAcademyOpen: boolean;
  academyLessonId: LessonId;
  openAcademy: (lessonId?: LessonId) => void;
  closeAcademy: () => void;
  isLoading: boolean;
}

