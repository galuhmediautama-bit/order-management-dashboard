import type { NotificationType } from '../types';

// Sound files mapping
const SOUND_MAP: Record<NotificationType, string> = {
  ORDER_NEW: '/sounds/cash.mp3',
  CART_ABANDON: '/sounds/alert.mp3',
  SYSTEM_ALERT: '/sounds/system.mp3',
};

// Cache audio instances untuk performa
const audioCache = new Map<string, HTMLAudioElement>();

/**
 * Play sound berdasarkan notification type
 * @param type - Notification type (ORDER_NEW, CART_ABANDON, SYSTEM_ALERT)
 * @param volume - Volume 0-1 (default: 0.5)
 */
export async function playSound(type: NotificationType, volume: number = 0.5): Promise<void> {
  try {
    const soundPath = SOUND_MAP[type];
    if (!soundPath) {
      console.warn(`No sound configured for notification type: ${type}`);
      return;
    }

    let audio = audioCache.get(soundPath);

    // Create audio element if not cached
    if (!audio) {
      audio = new Audio(soundPath);
      audio.volume = Math.max(0, Math.min(1, volume)); // Clamp 0-1
      audioCache.set(soundPath, audio);
    } else {
      // Reset audio untuk bisa play berkali-kali
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, volume));
    }

    // Play dengan error handling
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      await playPromise;
    }
  } catch (error) {
    console.error(`Error playing sound for type ${type}:`, error);
    // Fail silently - jangan throw error untuk UX yang lebih baik
  }
}

/**
 * Stop audio yang sedang diplay
 * @param type - Notification type
 */
export function stopSound(type: NotificationType): void {
  try {
    const soundPath = SOUND_MAP[type];
    const audio = audioCache.get(soundPath);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  } catch (error) {
    console.error(`Error stopping sound for type ${type}:`, error);
  }
}

/**
 * Stop semua audio
 */
export function stopAllSounds(): void {
  try {
    audioCache.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  } catch (error) {
    console.error('Error stopping all sounds:', error);
  }
}

/**
 * Check apakah suara bisa diplay (browser support)
 */
export function isSoundSupported(): boolean {
  try {
    const audio = new Audio();
    return !!audio.canPlayType;
  } catch {
    return false;
  }
}

/**
 * Preload semua sound files
 * Jalankan ini saat app initialize untuk faster playback
 */
export async function preloadSounds(): Promise<void> {
  try {
    const soundPaths = Object.values(SOUND_MAP);
    const promises = soundPaths.map(
      (path) =>
        new Promise<void>((resolve) => {
          try {
            const audio = new Audio(path);
            audio.addEventListener('canplaythrough', () => {
              audioCache.set(path, audio);
              resolve();
            });
            audio.addEventListener('error', () => {
              console.warn(`Failed to preload sound: ${path}`);
              resolve(); // Resolve anyway untuk tidak block
            });
            audio.load();
          } catch (error) {
            console.warn(`Error preloading sound ${path}:`, error);
            resolve();
          }
        })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error preloading sounds:', error);
  }
}

/**
 * Utility untuk play sound dengan custom path
 * Useful untuk sound yang tidak dalam default map
 */
export async function playSoundPath(path: string, volume: number = 0.5): Promise<void> {
  try {
    let audio = audioCache.get(path);

    if (!audio) {
      audio = new Audio(path);
      audioCache.set(path, audio);
    } else {
      audio.currentTime = 0;
    }

    audio.volume = Math.max(0, Math.min(1, volume));
    await audio.play();
  } catch (error) {
    console.error(`Error playing sound: ${path}`, error);
  }
}

/**
 * Clear audio cache (untuk memory cleanup)
 */
export function clearAudioCache(): void {
  audioCache.forEach((audio) => {
    audio.pause();
    audio.src = '';
  });
  audioCache.clear();
}
