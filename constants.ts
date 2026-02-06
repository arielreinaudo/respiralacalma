
import { Preset } from './types';

export const BREATH_PRESETS: Preset[] = [
  { id: 'calmar', name: 'Calmar', inhale: 4, exhale: 6, hold: 0 },
  { id: 'enfocar', name: 'Enfocar', inhale: 4, exhale: 4, hold: 0 },
  { id: 'dormir', name: 'Dormir', inhale: 4, exhale: 6, hold: 2 },
  { id: 'recuperar', name: 'Recuperar', inhale: 5, exhale: 5, hold: 0 },
];

export const MICRO_TIPS = [
  "Mandíbula suelta",
  "Hombros pesados",
  "Exhalación larga y suave",
  "Respirá silencioso por nariz",
  "Siente el aire entrar fresco",
  "Suelta la tensión con cada exhalación",
  "Columna recta pero relajada",
  "Enfócate en el ritmo"
];

export const DURATIONS = [2, 5, 10, 'free'];
