
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Screen, Phase, BreathConfig, Preferences, SessionRecord } from './types';
import { BREATH_PRESETS, DURATIONS, MICRO_TIPS } from './constants';
import { audioService } from './services/AudioService';
import WaveCanvas from './components/WaveCanvas';

// --- Helper Components defined outside App to prevent re-mount on every state update ---

const BreathingCircle: React.FC<{ phase: Phase; progress: number; amplitude: number; cycleCount: number }> = ({ phase, progress, amplitude, cycleCount }) => {
  const rampFactor = cycleCount < 3 ? 0.8 + (cycleCount * 0.06) : 1.0;
  const currentScale = phase === Phase.INHALE 
      ? 0.5 + (0.5 * amplitude * rampFactor * progress)
      : phase === Phase.EXHALE
      ? 0.5 + (0.5 * amplitude * rampFactor * (1 - progress))
      : 0.5;

  return (
      <div 
        className="relative flex items-center justify-center transition-transform duration-100 will-change-transform" 
        style={{ transform: `scale(${currentScale})` }}
      >
          <div className="w-64 h-64 bg-blue-600 rounded-full shadow-[0_0_60px_rgba(37,99,235,0.4)] flex items-center justify-center border-4 border-blue-400/30">
              <span className="text-white font-bold uppercase tracking-widest text-xl drop-shadow-md">
                  {phase === Phase.INHALE ? 'Inhala' : phase === Phase.EXHALE ? 'Exhala' : 'Pausa'}
              </span>
          </div>
          <div className="absolute w-72 h-72 bg-blue-400 rounded-full opacity-10 animate-ping"></div>
      </div>
  );
};

const App: React.FC = () => {
  // --- State ---
  const [screen, setScreen] = useState<Screen>(Screen.SETUP);
  const [config, setConfig] = useState<BreathConfig>({
    inhale: 4,
    exhale: 6,
    hold: 0,
    duration: 5,
    amplitude: 0.8
  });
  
  // Mantenemos las preferencias en estado interno pero sin controles en UI
  const [prefs, setPrefs] = useState<Preferences>(() => {
    const saved = localStorage.getItem('breath_prefs');
    if (saved) return JSON.parse(saved);
    return {
      darkMode: true,
      reduceMotion: false,
      audioVolume: 0.5,
      isMuted: false,
      silentMode: false
    };
  });

  const [history, setHistory] = useState<SessionRecord[]>([]);

  // Runtime Session State
  const [phase, setPhase] = useState<Phase>(Phase.INHALE);
  const [progress, setProgress] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Refs for logic
  const requestRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const lastSecondEmittedRef = useRef<number>(-1);
  const tipTimerRef = useRef<number>(0);

  // --- Theme Object ---
  const theme = useMemo(() => ({
    bg: prefs.darkMode ? 'bg-slate-950' : 'bg-slate-50',
    card: prefs.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100',
    input: prefs.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900',
    textMain: prefs.darkMode ? 'text-white' : 'text-slate-900',
    textDim: prefs.darkMode ? 'text-slate-300' : 'text-slate-500',
    btnSecondary: prefs.darkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    label: prefs.darkMode ? 'text-slate-400' : 'text-slate-500',
  }), [prefs.darkMode]);

  // --- Persistence ---
  useEffect(() => {
    const savedHistory = localStorage.getItem('breath_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem('breath_prefs', JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    audioService.updateSettings(prefs.audioVolume, prefs.isMuted, prefs.silentMode);
  }, [prefs.audioVolume, prefs.isMuted, prefs.silentMode]);

  // --- Logic ---

  const stopSession = useCallback(() => {
    setIsActive(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setScreen(Screen.SETUP);
  }, []);

  const startSession = (isCalibration: boolean) => {
    setCycleCount(0);
    setPhase(Phase.INHALE);
    setProgress(0);
    setTipIndex(0);
    accumulatedTimeRef.current = 0;
    lastFrameTimeRef.current = 0;
    lastSecondEmittedRef.current = -1;
    tipTimerRef.current = 0;
    
    if (isCalibration) {
      setTimeLeft(30);
      setScreen(Screen.CALIBRATION);
    } else {
      setTimeLeft(config.duration === 'free' ? 0 : config.duration * 60);
      setScreen(Screen.SESSION);
    }
    setIsActive(true);
  };

  const update = useCallback((time: number) => {
    if (!isActive) {
      lastFrameTimeRef.current = 0;
      return;
    }

    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = time;
    }

    const deltaTime = (time - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = time;
    accumulatedTimeRef.current += deltaTime;
    
    const elapsedTotal = accumulatedTimeRef.current;
    const currentSecond = Math.floor(elapsedTotal);

    if (currentSecond > lastSecondEmittedRef.current) {
        lastSecondEmittedRef.current = currentSecond;
        audioService.playClick();
        
        if (screen === Screen.CALIBRATION || (screen === Screen.SESSION && config.duration !== 'free')) {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsActive(false);
                    return 0;
                }
                return prev - 1;
            });
        }
        
        tipTimerRef.current += 1;
        if (tipTimerRef.current >= 15) {
            tipTimerRef.current = 0;
            setTipIndex(prev => (prev + 1) % MICRO_TIPS.length);
        }
    }

    const cycleTime = config.inhale + config.exhale + config.hold;
    const timeInCycle = elapsedTotal % cycleTime;
    const cycleIdx = Math.floor(elapsedTotal / cycleTime);

    let nextPhase = Phase.INHALE;
    let nextProgress = 0;

    if (timeInCycle < config.inhale) {
      nextPhase = Phase.INHALE;
      nextProgress = timeInCycle / config.inhale;
    } else if (timeInCycle < config.inhale + config.exhale) {
      nextPhase = Phase.EXHALE;
      nextProgress = (timeInCycle - config.inhale) / config.exhale;
    } else {
      nextPhase = Phase.HOLD;
      nextProgress = (timeInCycle - config.inhale - config.exhale) / config.hold;
    }

    setPhase(nextPhase);
    setProgress(nextProgress);
    setCycleCount(cycleIdx);

    requestRef.current = requestAnimationFrame(update);
  }, [isActive, config, screen]);

  useEffect(() => {
    if (isActive) {
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (timeLeft === 0 && screen === Screen.SESSION && accumulatedTimeRef.current > 0) {
          setScreen(Screen.SUMMARY);
      }
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isActive, update, timeLeft, screen]);

  // --- Components ---

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bg}`}>
      <main className="container mx-auto max-w-4xl min-h-screen">
        {screen === Screen.SETUP && (
          <div className="max-w-xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="text-center space-y-6">
              <h1 className={`text-4xl font-bold tracking-tight ${theme.textMain}`}>Emyti Holistic Healing</h1>
              <p className={`${theme.textMain} text-lg max-w-md mx-auto font-medium`}>
                Regula tu Estrés y Mejora tu Bienestar con Coherencia Cardíaca
              </p>
              
              <div className="flex flex-col items-center gap-3 pt-2">
                <p className={`${theme.textDim} text-[10px] uppercase tracking-widest font-bold`}>Guias</p>
                <div className="flex justify-center items-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500/30 shadow-lg bg-slate-200">
                      <img 
                        src="https://www.dropbox.com/scl/fi/otjqcs6zsn2xlek2pxnn0/Adriana-circle.png?rlkey=9nelpp0neu1ihmqdic4cwme3x&dl=1" 
                        alt="Dra. Adriana Ortiz" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className={`${theme.textMain} text-[10px] font-bold`}>Dra. Adriana Ortiz</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500/30 shadow-lg bg-slate-200">
                      <img 
                        src="https://www.dropbox.com/scl/fi/v6b871uxejflzh2alff3z/Iconos-landing-visualmedita.png?rlkey=55j22v07rloudtrt3v2fj3ez9&dl=1" 
                        alt="Ariel Reinaudo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className={`${theme.textMain} text-[10px] font-bold`}>Ariel Reinaudo</p>
                  </div>
                </div>
              </div>
            </header>

            <section>
              <h2 className={`text-xs font-semibold uppercase tracking-wider ${theme.label} mb-4`}>Objetivo</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BREATH_PRESETS.map(p => {
                  const isSelected = config.inhale === p.inhale && config.exhale === p.exhale && config.hold === p.hold;
                  return (
                    <button key={p.id} onClick={() => setConfig({...config, ...p})} className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${isSelected ? 'bg-blue-600 text-white shadow-xl scale-105' : `${theme.card} ${theme.textDim} border hover:border-blue-400`}`}>
                      {p.name}
                      <div className="text-[10px] opacity-70">{p.inhale}/{p.exhale}/{p.hold}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={`${theme.card} p-6 rounded-3xl border shadow-sm space-y-6`}>
              <div className="grid grid-cols-3 gap-4">
                {['inhale', 'exhale', 'hold'].map((key) => (
                  <div key={key} className="text-center">
                    <label className={`block text-[10px] uppercase font-bold ${theme.label} mb-1`}>{key === 'inhale' ? 'Inhala' : key === 'exhale' ? 'Exhala' : 'Pausa'}</label>
                    <input type="number" step="0.5" value={config[key as keyof BreathConfig] as number} onChange={e => setConfig({...config, [key]: parseFloat(e.target.value) || 0})} className={`w-full ${theme.input} rounded-lg p-2 text-center font-bold border`} />
                  </div>
                ))}
              </div>
              <div>
                <label className={`flex justify-between text-sm ${theme.label} mb-2`}><span>Amplitud</span><span className={`font-bold ${theme.textMain}`}>{Math.round(config.amplitude * 100)}%</span></label>
                <input type="range" min="0.5" max="1" step="0.05" value={config.amplitude} onChange={e => setConfig({...config, amplitude: parseFloat(e.target.value)})} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div>
                <label className={`block text-sm ${theme.label} mb-2`}>Duración (minutos)</label>
                <div className="flex gap-2">
                  {DURATIONS.map(d => (
                    <button key={d} onClick={() => setConfig({...config, duration: d as any})} className={`flex-1 py-2 rounded-lg text-sm transition-all ${config.duration === d ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20' : `${theme.btnSecondary}`}`}>
                      {d === 'free' ? 'Libre' : d}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => startSession(true)} className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-bold ${prefs.darkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-blue-100 text-blue-600 hover:bg-blue-50'}`}>Calibrar</button>
                <button onClick={() => startSession(false)} className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95">Comenzar</button>
              </div>
              <div className="flex flex-col items-center gap-6">
                <div className="flex justify-center gap-6 items-center w-full">
                  <a 
                    href="https://webilution.ac-page.com/regulatuestres?test=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-semibold py-2 px-4 rounded-full border border-transparent transition-all hover:border-slate-300 dark:hover:border-slate-700 ${theme.textDim} hover:${theme.textMain}`}
                  >
                    Más información
                  </a>
                  <a 
                    href="https://content.app-us1.com/obmj7/2025/03/05/268c1b32-46aa-48ab-8640-a11e1ee25aa1.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-semibold py-2 px-4 rounded-full border border-transparent transition-all hover:border-slate-300 dark:hover:border-slate-700 ${theme.textDim} hover:${theme.textMain}`}
                  >
                    Ebook gratis
                  </a>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <p className={`text-[10px] text-center px-8 italic opacity-80 ${theme.textDim} leading-relaxed max-w-xs`}>
                    Se recomienda usar esta aplicación luego de la consulta con los profesionales
                  </p>
                  <a 
                    href="https://calendly.com/adrianaortiz/regulatuestres?month=2026-02"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`py-3 px-8 rounded-2xl text-sm font-bold border transition-all hover:scale-[1.03] active:scale-95 shadow-sm ${prefs.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                  >
                    Agendar una Consulta
                  </a>
                  
                  <p className={`text-[9px] text-center px-4 mt-2 opacity-60 ${theme.textDim} leading-tight max-w-sm`}>
                    <strong>Descargo de responsabilidad:</strong> Esta aplicación es una herramienta informativa y de bienestar personal. No sustituye el diagnóstico, tratamiento o consejo médico profesional. Siempre consulte con un profesional de la salud antes de iniciar cualquier práctica de respiración si tiene condiciones médicas preexistentes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {screen === Screen.CALIBRATION && (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-12">
            <header><h2 className={`text-2xl font-bold ${theme.textMain}`}>Modo Calibración</h2><p className={theme.textDim}>Ajusta el ritmo a tu comodidad.</p></header>
            <BreathingCircle phase={phase} progress={progress} amplitude={config.amplitude} cycleCount={cycleCount} />
            <div className="w-full max-w-md space-y-6">
              <div className={`${theme.card} flex justify-between items-center p-4 rounded-2xl shadow-sm border`}>
                <button 
                  onClick={() => { 
                    setConfig(prev => ({ ...prev, inhale: prev.inhale + 0.5, exhale: prev.exhale + 0.5 })); 
                  }} 
                  className={`px-6 py-3 rounded-xl font-bold ${theme.btnSecondary}`}
                >
                  Más lento
                </button>
                <div className={`font-mono text-lg font-bold ${theme.textMain}`}>{config.inhale.toFixed(1)}s / {config.exhale.toFixed(1)}s</div>
                <button 
                  onClick={() => { 
                    setConfig(prev => ({ 
                      ...prev, 
                      inhale: Math.max(2, prev.inhale - 0.5), 
                      exhale: Math.max(2, prev.exhale - 0.5) 
                    })); 
                  }} 
                  className={`px-6 py-3 rounded-xl font-bold ${theme.btnSecondary}`}
                >
                  Más rápido
                </button>
              </div>
              <div className="flex gap-4">
                <button onClick={stopSession} className={`flex-1 py-4 border rounded-2xl font-medium ${theme.btnSecondary}`}>Volver</button>
                <button onClick={() => startSession(false)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">Comenzar</button>
              </div>
            </div>
          </div>
        )}

        {screen === Screen.SESSION && (
          <div className="flex flex-col items-center justify-between min-h-screen p-6 text-center">
            <div className="w-full flex justify-between items-center">
              <div className="text-left"><div className={`text-[10px] ${theme.label} font-bold uppercase tracking-widest`}>Ciclos</div><div className="text-2xl font-bold font-mono text-blue-600">{cycleCount}</div></div>
              <div className="text-right"><div className={`text-[10px] ${theme.label} font-bold uppercase tracking-widest`}>Restante</div><div className={`text-2xl font-bold font-mono ${theme.textMain}`}>{config.duration === 'free' ? '∞' : formatTime(timeLeft)}</div></div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center space-y-16 w-full">
              <BreathingCircle phase={phase} progress={progress} amplitude={config.amplitude} cycleCount={cycleCount} />
              <div className="w-full max-w-2xl px-4"><WaveCanvas phase={phase} progress={progress} inhaleTime={config.inhale} exhaleTime={config.exhale} holdTime={config.hold} reduceMotion={prefs.reduceMotion} darkMode={prefs.darkMode} /></div>
              <p className={`text-lg font-medium italic animate-in fade-in duration-1000 ${theme.textMain}`}>{MICRO_TIPS[tipIndex]}</p>
            </div>
            <div className="w-full max-w-md flex gap-4 pt-8 pb-4">
              <button onClick={() => setIsActive(!isActive)} className={`flex-1 py-4 rounded-2xl font-bold transition-all active:scale-95 ${isActive ? theme.btnSecondary : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'}`}>{isActive ? 'Pausar' : 'Continuar'}</button>
              <button onClick={stopSession} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${theme.btnSecondary}`}>Salir</button>
            </div>
          </div>
        )}

        {screen === Screen.SUMMARY && (
          <div className={`max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-6 space-y-12 text-center animate-in zoom-in-95 duration-500 ${theme.bg}`}>
            <h2 className={`text-3xl font-bold ${theme.textMain}`}>¡Bien hecho!</h2>
            <div className={`${theme.card} p-8 rounded-3xl border shadow-xl w-full`}>
               <button onClick={stopSession} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl">Finalizar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
