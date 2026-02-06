
import { Preset } from './types';

export const BREATH_PRESETS: Record<string, Preset[]> = {
  es: [
    { id: 'calmar', name: 'Calmar', inhale: 4, exhale: 6, hold: 0 },
    { id: 'enfocar', name: 'Enfocar', inhale: 4, exhale: 4, hold: 0 },
    { id: 'dormir', name: 'Dormir', inhale: 4, exhale: 6, hold: 2 },
    { id: 'recuperar', name: 'Recuperar', inhale: 5, exhale: 5, hold: 0 },
  ],
  en: [
    { id: 'calm', name: 'Calm', inhale: 4, exhale: 6, hold: 0 },
    { id: 'focus', name: 'Focus', inhale: 4, exhale: 4, hold: 0 },
    { id: 'sleep', name: 'Sleep', inhale: 4, exhale: 6, hold: 2 },
    { id: 'recover', name: 'Recover', inhale: 5, exhale: 5, hold: 0 },
  ]
};

export const MICRO_TIPS: Record<string, string[]> = {
  es: [
    "Mandíbula suelta",
    "Hombros pesados",
    "Exhalación larga y suave",
    "Respirá silencioso por nariz",
    "Siente el aire entrar fresco",
    "Suelta la tensión con cada exhalación",
    "Columna recta pero relajada",
    "Enfócate en el ritmo"
  ],
  en: [
    "Loose jaw",
    "Heavy shoulders",
    "Long, smooth exhalation",
    "Breathe silently through nose",
    "Feel the cool air coming in",
    "Release tension with each breath",
    "Straight but relaxed spine",
    "Focus on the rhythm"
  ]
};

export const DURATIONS = [2, 5, 10, 'free'];

export const UI_TEXT = {
  es: {
    subtitle: "Regula tu Estrés y Mejora tu Bienestar con Coherencia Cardíaca",
    guides: "Guías",
    objective: "Objetivo",
    inhale: "Inhala",
    exhale: "Exhala",
    hold: "Pausa",
    amplitude: "Amplitud",
    duration: "Duración (minutos)",
    free: "Libre",
    calibrate: "Calibrar",
    start: "Comenzar",
    moreInfo: "Más información",
    freeEbook: "Ebook gratis",
    recommendation: "Se recomienda usar esta aplicación luego de la consulta con los profesionales",
    schedule: "Agendar una Consulta",
    disclaimer: "Descargo de responsabilidad: Esta aplicación es una herramienta informativa y de bienestar personal. No sustituye el diagnóstico, tratamiento o consejo médico profesional. Siempre consulte con un profesional de la salud antes de iniciar cualquier práctica de respiración si tiene condiciones médicas preexistentes.",
    calibTitle: "Modo Calibración",
    calibDesc: "Ajusta el ritmo a tu comodidad antes de comenzar.",
    timeLeft: "Tiempo restante",
    slower: "Más lento",
    faster: "Más rápido",
    back: "Volver",
    cycles: "Ciclos",
    remaining: "Restante",
    pause: "Pausar",
    continue: "Continuar",
    exit: "Salir",
    wellDone: "¡Bien hecho!",
    finish: "Finalizar"
  },
  en: {
    subtitle: "Regulate your Stress and Improve your Well-being with Cardiac Coherence",
    guides: "Guides",
    objective: "Objective",
    inhale: "Inhale",
    exhale: "Exhale",
    hold: "Hold",
    amplitude: "Amplitude",
    duration: "Duration (minutes)",
    free: "Free",
    calibrate: "Calibrate",
    start: "Start",
    moreInfo: "More info",
    freeEbook: "Free Ebook",
    recommendation: "It is recommended to use this app after consulting with professionals",
    schedule: "Schedule a Consultation",
    disclaimer: "Disclaimer: This application is an informative and personal well-being tool. It does not replace professional medical diagnosis, treatment, or advice. Always consult with a healthcare professional before starting any breathing practice if you have pre-existing medical conditions.",
    calibTitle: "Calibration Mode",
    calibDesc: "Adjust the rhythm to your comfort before starting.",
    timeLeft: "Time left",
    slower: "Slower",
    faster: "Faster",
    back: "Back",
    cycles: "Cycles",
    remaining: "Remaining",
    pause: "Pause",
    continue: "Continue",
    exit: "Exit",
    wellDone: "Well done!",
    finish: "Finish"
  }
};
