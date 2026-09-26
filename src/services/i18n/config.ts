export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isSystem?: boolean;
  titleKey?: string;
  subtitleKey?: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'system',
    name: 'Theo hệ thống',
    nativeName: 'System Default',
    flag: '🌐',
    isSystem: true,
    titleKey: 'common.systemDefault',
    subtitleKey: 'welcome.systemOptionHint',
  },
  {
    code: 'vi',
    name: 'Tiếng Việt',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
];

export const DEFAULT_LANGUAGE = 'vi';
export const FALLBACK_LANGUAGE = 'vi';

export const STORAGE_KEY_LANGUAGE = '@simple_otp:language';
export const STORAGE_KEY_INITIALIZED = '@simple_otp:language_initialized';
