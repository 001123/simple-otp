/* eslint-disable import/no-named-as-default-member */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { AppState, type AppStateStatus } from 'react-native';

import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  STORAGE_KEY_LANGUAGE,
  STORAGE_KEY_INITIALIZED,
  type SupportedLanguage,
} from './config';
import { vi } from './locales/vi';
import { en } from './locales/en';

export const resources = {
  vi: { translation: vi },
  en: { translation: en },
} as const;

function getAsyncStorage() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-async-storage/async-storage');
  return mod.default || mod;
}

/**
 * Resolves the actual language code ('vi' | 'en') from device system locales.
 */
export function resolveSystemLanguage(
  customLocales?: { languageCode?: string | null }[]
): 'vi' | 'en' {
  try {
    const locales = customLocales ?? getLocales();
    const primaryCode = locales?.[0]?.languageCode?.toLowerCase() || '';
    if (primaryCode.startsWith('vi')) {
      return 'vi';
    }
    if (primaryCode.startsWith('en')) {
      return 'en';
    }
    // Match against other supported languages if available
    const matched = SUPPORTED_LANGUAGES.find(
      (l) => !l.isSystem && primaryCode.startsWith(l.code)
    );
    if (matched) {
      return matched.code as 'vi' | 'en';
    }
  } catch {
    // Ignore fallback
  }
  return DEFAULT_LANGUAGE as 'vi';
}

/**
 * Gets currently saved language preference ('system' | 'vi' | 'en').
 */
export async function getSavedLanguagePreference(): Promise<'system' | 'vi' | 'en' | null> {
  try {
    const val = await getAsyncStorage().getItem(STORAGE_KEY_LANGUAGE);
    if (val === 'system' || val === 'vi' || val === 'en') {
      return val;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Changes active app language and saves preference.
 */
export async function setAppLanguage(preference: 'system' | 'vi' | 'en'): Promise<void> {
  try {
    await getAsyncStorage().setItem(STORAGE_KEY_LANGUAGE, preference);
  } catch {
    // Ignore storage write error
  }

  const effectiveLang = preference === 'system' ? resolveSystemLanguage() : preference;
  await i18n.changeLanguage(effectiveLang);
}

/**
 * Check if the user has completed first-time language selection.
 */
export async function isLanguageInitialized(): Promise<boolean> {
  try {
    const val = await getAsyncStorage().getItem(STORAGE_KEY_INITIALIZED);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark language selection as initialized.
 */
export async function setLanguageInitialized(initialized: boolean = true): Promise<void> {
  try {
    await getAsyncStorage().setItem(STORAGE_KEY_INITIALIZED, initialized ? 'true' : 'false');
  } catch {
    // Ignore storage write error
  }
}

// Synchronously determine initial language for i18next
const initialDeviceLang =
  process.env.NODE_ENV === 'test'
    ? (process.env.TEST_LOCALE || DEFAULT_LANGUAGE)
    : resolveSystemLanguage();

// Initialize i18next
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: initialDeviceLang,
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: {
      escapeValue: false, // React already handles XSS
    },
    compatibilityJSON: 'v4',
  });

  // Asynchronously sync from saved preference if available (skip in unit test runner)
  if (process.env.NODE_ENV !== 'test') {
    getSavedLanguagePreference().then((saved) => {
      if (saved) {
        const active = saved === 'system' ? resolveSystemLanguage() : saved;
        if (i18n.language !== active) {
          i18n.changeLanguage(active);
        }
      }
    });
  }
}

/**
 * Sets up an AppState listener to automatically re-sync system locale
 * if the user selected 'system' and returns to foreground.
 */
export function setupLocaleAppStateListener(): () => void {
  const handleAppStateChange = async (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      const pref = await getSavedLanguagePreference();
      if (pref === 'system') {
        const currentSystem = resolveSystemLanguage();
        if (i18n.language !== currentSystem) {
          i18n.changeLanguage(currentSystem);
        }
      }
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => {
    subscription.remove();
  };
}

export { SUPPORTED_LANGUAGES, type SupportedLanguage };
export default i18n;
