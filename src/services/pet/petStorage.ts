import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PetId } from '@/types/pet';

export const PET_STORAGE_KEY = '@simple_otp_selected_pet';
export const DEFAULT_PET_ID: PetId = 'cipher-cat';

export const VALID_PET_IDS: readonly PetId[] = [
  'cipher-cat',
  'byte-dog',
  'shield-bunny',
] as const;

export function isValidPetId(value: unknown): value is PetId {
  return typeof value === 'string' && VALID_PET_IDS.includes(value as PetId);
}

export type PetChangeListener = (petId: PetId) => void;

export class PetStorageService {
  private inMemoryCachedPet: PetId | null = null;
  private listeners: Set<PetChangeListener> = new Set();

  /**
   * Retrieves the currently selected pet ID from AsyncStorage.
   * Defaults to 'cipher-cat' if not yet persisted or if value is corrupted.
   */
  async getSelectedPet(): Promise<PetId> {
    if (this.inMemoryCachedPet) {
      return this.inMemoryCachedPet;
    }

    try {
      const stored = await AsyncStorage.getItem(PET_STORAGE_KEY);
      if (isValidPetId(stored)) {
        this.inMemoryCachedPet = stored;
        return stored;
      }
    } catch {
      // Storage error fallback
    }

    this.inMemoryCachedPet = DEFAULT_PET_ID;
    return DEFAULT_PET_ID;
  }

  /**
   * Persists a new selected pet ID to AsyncStorage and notifies subscribers.
   */
  async setSelectedPet(petId: PetId): Promise<void> {
    if (!isValidPetId(petId)) {
      throw new Error(`Invalid petId: "${String(petId)}". Expected one of: ${VALID_PET_IDS.join(', ')}`);
    }

    this.inMemoryCachedPet = petId;

    try {
      await AsyncStorage.setItem(PET_STORAGE_KEY, petId);
    } catch {
      // Disk write failure fallback: keep memory cache
    }

    // Broadcast to reactive subscribers
    this.notifyListeners(petId);
  }

  /**
   * Resets the selected pet to default 'cipher-cat'.
   */
  async resetSelectedPet(): Promise<void> {
    await this.setSelectedPet(DEFAULT_PET_ID);
  }

  /**
   * Subscribes to mascot selection changes across the app.
   */
  subscribe(listener: PetChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(petId: PetId): void {
    for (const listener of this.listeners) {
      try {
        listener(petId);
      } catch {
        // Prevent listener exception from disrupting other subscribers
      }
    }
  }

  /**
   * Helper for unit tests to reset in-memory cache and subscribers.
   */
  _clearMemoryCacheForTesting(): void {
    this.inMemoryCachedPet = null;
    this.listeners.clear();
  }
}

export const petStorage = new PetStorageService();
