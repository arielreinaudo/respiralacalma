
export enum Screen {
  SETUP = 'SETUP',
  CALIBRATION = 'CALIBRATION',
  SESSION = 'SESSION',
  SUMMARY = 'SUMMARY'
}

export enum Phase {
  INHALE = 'INHALE',
  EXHALE = 'EXHALE',
  HOLD = 'HOLD'
}

export interface BreathConfig {
  inhale: number;
  exhale: number;
  hold: number;
  duration: number | 'free';
  amplitude: number; // 0 to 1
}

export interface Preset {
  id: string;
  name: string;
  inhale: number;
  exhale: number;
  hold: number;
}

export interface SessionRecord {
  id: string;
  date: string;
  config: BreathConfig;
  totalTime: number;
  tension: number;
  comfort: 'Fácil' | 'Media' | 'Difícil';
}

export interface Preferences {
  darkMode: boolean;
  reduceMotion: boolean;
  audioVolume: number;
  isMuted: boolean;
  silentMode: boolean;
}
