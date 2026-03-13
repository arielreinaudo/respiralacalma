
import { Preset } from './types';

export const BREATH_PRESETS: Record<string, Preset[]> = {
  es: [
    { id: 'calmar', name: 'Calmar', inhale: 4, exhale: 6, hold: 0 },
    { id: 'enfocar', name: 'Enfocar', inhale: 4, exhale: 4, hold: 2 },
    { id: 'dormir', name: 'Dormir', inhale: 4, exhale: 6, hold: 2 },
    { id: 'recuperar', name: 'Recuperar', inhale: 5, exhale: 5, hold: 0 },
  ],
  en: [
    { id: 'calm', name: 'Calm', inhale: 4, exhale: 6, hold: 0 },
    { id: 'focus', name: 'Focus', inhale: 4, exhale: 4, hold: 2 },
    { id: 'sleep', name: 'Sleep', inhale: 4, exhale: 6, hold: 2 },
    { id: 'recover', name: 'Recover', inhale: 5, exhale: 5, hold: 0 },
  ]
};

export const MICRO_TIPS: Record<string, string[]> = {
  es: [
    "Respirando lento, tu corazón se sincroniza.",
    "Inhalando calma, exhalando toda la tensión.",
    "Tu frecuencia cardíaca se va armonizando.",
    "Llenando tus pulmones, liberando el estrés.",
    "Entrando en un estado de coherencia.",
    "Tu cuerpo entero se va soltando.",
    "Relajando cada músculo, liberando tu peso.",
    "Tu sistema nervioso se está calmando.",
    "Permitiendo que tu cuerpo se repare.",
    "Descansando y restaurando toda tu energía.",
    "Fluyendo suavemente con el momento presente.",
    "Tu mente se va volviendo serena.",
    "Soltando los pensamientos, habitando tu cuerpo.",
    "Sintiendo una paz interior muy profunda.",
    "Encontrando el equilibrio en tu centro.",
    "Cada respiración te va sanando profundamente.",
    "Tu vitalidad se está renovando ahora.",
    "Cultivando tu bienestar, latido a latido.",
    "Sanando y fortaleciendo tu sistema natural.",
    "Respirando y abrazando tu propia salud."
  ],
  en: [
    "Breathing slowly, your heart synchronizes.",
    "Inhaling calm, exhaling all tension.",
    "Your heart rate is harmonizing.",
    "Filling your lungs, releasing stress.",
    "Entering a state of coherence.",
    "Your whole body is letting go.",
    "Relaxing every muscle, releasing your weight.",
    "Your nervous system is calming down.",
    "Allowing your body to repair itself.",
    "Resting and restoring all your energy.",
    "Flowing gently with the present moment.",
    "Your mind is becoming serene.",
    "Letting go of thoughts, inhabiting your body.",
    "Feeling a very deep inner peace.",
    "Finding balance in your center.",
    "Each breath is healing you deeply.",
    "Your vitality is being renewed now.",
    "Cultivating your well-being, beat by beat.",
    "Healing and strengthening your natural system.",
    "Breathing and embracing your own health."
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
    finish: "Finalizar",
    volume: "Volumen del Sonido"
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
    finish: "Finish",
    volume: "Sound Volume"
  }
};
