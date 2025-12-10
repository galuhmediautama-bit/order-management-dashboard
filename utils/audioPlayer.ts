import type { NotificationType } from '../types';

// Audio Context singleton
let audioContext: AudioContext | null = null;

// Cached audio buffer for MP3 file
let cashRegisterBuffer: AudioBuffer | null = null;

/**
 * Get or create AudioContext
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Load and cache the cash register MP3 file
 */
async function loadCashRegisterSound(): Promise<AudioBuffer | null> {
  if (cashRegisterBuffer) return cashRegisterBuffer;

  try {
    const ctx = getAudioContext();
    const response = await fetch('/sounds/cash-register.mp3');
    const arrayBuffer = await response.arrayBuffer();
    cashRegisterBuffer = await ctx.decodeAudioData(arrayBuffer);
    return cashRegisterBuffer;
  } catch (error) {
    console.error('Error loading cash register sound:', error);
    return null;
  }
}

/**
 * Play the cash register MP3 sound
 */
async function playCashRegisterMP3(volume: number = 0.8): Promise<void> {
  const ctx = getAudioContext();
  const buffer = await loadCashRegisterSound();

  if (!buffer) {
    // Fallback to generated tone if MP3 fails
    console.warn('MP3 failed, using fallback tone');
    await playToneSequence(SOUND_CONFIGS.ORDER_NEW, volume);
    return;
  }

  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();

  source.buffer = buffer;
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start(0);
}

/**
 * Sound configurations - louder and clearer sounds
 */
interface SoundConfig {
  frequencies: number[];
  durations: number[];
  type: OscillatorType;
  gainStart: number;
  gainEnd: number;
  repeat?: number;
  delayBetween?: number;
}

const SOUND_CONFIGS: Record<NotificationType, SoundConfig> = {
  // New Order - Loud cash register "cha-ching" sound (3 tones)
  ORDER_NEW: {
    frequencies: [1200, 1500, 1800], // Higher frequencies = more audible
    durations: [0.12, 0.12, 0.25],
    type: 'square', // Square wave is louder/sharper
    gainStart: 0.6,
    gainEnd: 0.1,
    repeat: 2,
    delayBetween: 400,
  },
  // Cart Abandon - Urgent alert sound (ascending tones)
  CART_ABANDON: {
    frequencies: [600, 900, 1200, 900, 600],
    durations: [0.1, 0.1, 0.15, 0.1, 0.2],
    type: 'sawtooth', // Sawtooth is harsh/attention-grabbing
    gainStart: 0.5,
    gainEnd: 0.1,
    repeat: 2,
    delayBetween: 300,
  },
  // System Alert - Warning beep
  SYSTEM_ALERT: {
    frequencies: [800, 800, 800],
    durations: [0.15, 0.1, 0.25],
    type: 'square',
    gainStart: 0.5,
    gainEnd: 0.1,
    repeat: 3,
    delayBetween: 200,
  },
};

/**
 * Play a sequence of tones
 */
async function playToneSequence(config: SoundConfig, volume: number = 1): Promise<void> {
  const ctx = getAudioContext();
  let startTime = ctx.currentTime;

  for (let i = 0; i < config.frequencies.length; i++) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequencies[i], startTime);

    // Volume envelope for cleaner sound
    const effectiveGainStart = config.gainStart * volume;
    const effectiveGainEnd = config.gainEnd * volume;

    gainNode.gain.setValueAtTime(effectiveGainStart, startTime);
    gainNode.gain.exponentialRampToValueAtTime(
      Math.max(effectiveGainEnd, 0.001),
      startTime + config.durations[i]
    );

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + config.durations[i]);

    startTime += config.durations[i];
  }
}

/**
 * Play sound berdasarkan notification type
 * @param type - Notification type (ORDER_NEW, CART_ABANDON, SYSTEM_ALERT)
 * @param volume - Volume 0-1 (default: 0.8 for louder sound)
 */
export async function playSound(type: NotificationType, volume: number = 0.8): Promise<void> {
  try {
    // Use MP3 file for new order notification
    if (type === 'ORDER_NEW') {
      await playCashRegisterMP3(volume);
      return;
    }

    const config = SOUND_CONFIGS[type];
    if (!config) {
      console.warn(`No sound configured for notification type: ${type}`);
      return;
    }

    const repeatCount = config.repeat || 1;
    const delayMs = config.delayBetween || 300;

    for (let r = 0; r < repeatCount; r++) {
      await playToneSequence(config, volume);
      if (r < repeatCount - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  } catch (error) {
    console.error(`Error playing sound for type ${type}:`, error);
  }
}

/**
 * Play a simple beep - useful for testing
 */
export function playBeep(frequency: number = 1000, duration: number = 0.2, volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.error('Error playing beep:', error);
  }
}

/**
 * Stop semua audio - Note: Web Audio API sounds auto-stop
 */
export function stopAllSounds(): void {
  // Web Audio oscillators auto-stop, nothing to do here
}

/**
 * Check apakah suara bisa diplay (browser support)
 */
export function isSoundSupported(): boolean {
  try {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  } catch {
    return false;
  }
}

/**
 * Preload sounds - initialize AudioContext on user interaction
 * Call this on first user click to enable sounds
 */
export async function preloadSounds(): Promise<void> {
  try {
    getAudioContext();
    // Play a silent tone to "warm up" the audio context
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime); // Silent
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.001);
  } catch (error) {
    console.error('Error preloading sounds:', error);
  }
}

/**
 * Test all notification sounds
 */
export async function testAllSounds(): Promise<void> {
  console.log('Testing ORDER_NEW sound...');
  await playSound('ORDER_NEW');
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('Testing CART_ABANDON sound...');
  await playSound('CART_ABANDON');
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('Testing SYSTEM_ALERT sound...');
  await playSound('SYSTEM_ALERT');
}

// Legacy functions for compatibility
export function stopSound(_type: NotificationType): void {
  // Web Audio oscillators auto-stop
}

export async function playSoundPath(_path: string, _volume: number = 0.5): Promise<void> {
  // Not needed with Web Audio API, play default beep instead
  playBeep();
}

export function clearAudioCache(): void {
  // No cache with Web Audio API
}
