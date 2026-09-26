import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  PetId,
  PetState,
  LessonId,
  UsePetCompanionOptions,
  UsePetCompanionResult,
} from '@/types/pet';
import { petStorage, DEFAULT_PET_ID } from '@/services/pet/petStorage';
import {
  resolveMascotState,
  COPIED_DURATION_MS,
  SPEECH_AUTO_DISMISS_MS,
} from '@/services/pet/mascotState';
import { getDialogueItem } from '@/services/pet/petDialogues';

export function usePetCompanion(options?: UsePetCompanionOptions): UsePetCompanionResult {
  const { accountCount = 0, hasUrgentTimer = false } = options ?? {};

  const [petId, setPetIdState] = useState<PetId>(DEFAULT_PET_ID);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopiedActive, setIsCopiedActive] = useState<boolean>(false);
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const [speechActionText, setSpeechActionText] = useState<string | null>(null);
  const [isSpeechVisible, setIsSpeechVisible] = useState<boolean>(false);
  const [isAcademyOpen, setIsAcademyOpen] = useState<boolean>(false);
  const [academyLessonId, setAcademyLessonId] = useState<LessonId>('lesson-1');

  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDialogueIdRef = useRef<string | undefined>(undefined);

  // Initialize pet from storage and subscribe to changes
  useEffect(() => {
    let mounted = true;

    petStorage.getSelectedPet().then((stored) => {
      if (mounted) {
        setPetIdState((current) => (current === DEFAULT_PET_ID ? stored : current));
        setIsLoading(false);
      }
    });

    const unsubscribe = petStorage.subscribe((newPet) => {
      if (mounted) {
        setPetIdState(newPet);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  // Compute active PetState according to strict precedence rules:
  // Precedence 1: EMPTY (accountCount <= 0)
  // Precedence 2: COPIED (isCopiedActive === true)
  // Precedence 3: WARNING (hasUrgentTimer === true)
  // Precedence 4: IDLE (default)
  const petState: PetState = resolveMascotState({
    accountCount,
    isAnyTotpUrgent: hasUrgentTimer,
    isCopiedActive,
  });

  // Switch pet handler
  const setPet = useCallback(async (newPet: PetId) => {
    setPetIdState(newPet);
    await petStorage.setSelectedPet(newPet);
  }, []);

  // Dismiss speech bubble
  const dismissSpeech = useCallback(() => {
    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    setIsSpeechVisible(false);
    setSpeechMessage(null);
    setSpeechActionText(null);
  }, []);

  // Trigger custom or contextual speech
  const triggerSpeech = useCallback(
    (customMessage?: string, timeoutMs = SPEECH_AUTO_DISMISS_MS, actionText?: string | null) => {
      if (speechTimerRef.current) {
        clearTimeout(speechTimerRef.current);
      }

      const messageToDisplay = customMessage ?? 'Chào bạn! Tớ đang canh gác kho mã an toàn.';
      setSpeechMessage(messageToDisplay);
      setSpeechActionText(actionText ?? null);
      setIsSpeechVisible(true);

      if (timeoutMs > 0) {
        speechTimerRef.current = setTimeout(() => {
          setIsSpeechVisible(false);
          setSpeechMessage(null);
          setSpeechActionText(null);
        }, timeoutMs);
      }
    },
    []
  );

  // Mascot tap handler
  const triggerTap = useCallback(() => {
    const item = getDialogueItem(petId, petState, {
      isTap: true,
      previousId: lastDialogueIdRef.current,
    });
    lastDialogueIdRef.current = item.id;
    triggerSpeech(item.text, SPEECH_AUTO_DISMISS_MS, item.actionText || 'Mở Pet Academy');
  }, [petId, petState, triggerSpeech]);

  // 1-Tap Copy transient celebration
  const triggerCopied = useCallback(() => {
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }

    setIsCopiedActive(true);
    const copyItem = getDialogueItem(petId, 'COPIED', {
      previousId: lastDialogueIdRef.current,
    });
    lastDialogueIdRef.current = copyItem.id;
    triggerSpeech(copyItem.text || 'Đã sao chép! An toàn tuyệt đối! 🎉', COPIED_DURATION_MS);

    copiedTimerRef.current = setTimeout(() => {
      setIsCopiedActive(false);
    }, COPIED_DURATION_MS);
  }, [petId, triggerSpeech]);

  // Pet Academy modal controls
  const openAcademy = useCallback((lessonId?: LessonId) => {
    if (lessonId) setAcademyLessonId(lessonId);
    setIsAcademyOpen(true);
  }, []);

  const closeAcademy = useCallback(() => {
    setIsAcademyOpen(false);
  }, []);

  return {
    petId,
    petState,
    setPet,
    speechMessage,
    speechActionText,
    isSpeechVisible,
    triggerSpeech,
    triggerTap,
    dismissSpeech,
    triggerCopied,
    isAcademyOpen,
    academyLessonId,
    openAcademy,
    closeAcademy,
    isLoading,
  };
}
