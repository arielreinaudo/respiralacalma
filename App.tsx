
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Screen, Phase, BreathConfig, Preferences, SessionRecord } from './types';
import { BREATH_PRESETS, DURATIONS, MICRO_TIPS, UI_TEXT } from './constants';
import { audioService } from './services/AudioService';
import WaveCanvas from './components/WaveCanvas';

const IMG_ADRIANA = "https://www.dropbox.com/scl/fi/otjqcs6zsn2xlek2pxnn0/Adriana-circle.png?rlkey=9nelpp0neu1ihmqdic4cwme3x&dl=1";
const IMG_ARIEL = "https://www.dropbox.com/scl/fi/v6b871uxejflzh2alff3z/Iconos-landing-visualmedita.png?rlkey=55j22v07rloudtrt3v2fj3ez9&dl=1";

const BreathingCircle: React.FC<{ phase: Phase; progress: number; amplitude: number; cycleCount: number; labels: { inhale: string, exhale: string, hold: string } }> = ({ phase, progress, amplitude, cycleCount, labels }) => {
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
                  {phase === Phase.INHALE ? labels.inhale : phase === Phase.EXHALE ? labels.exhale : labels.hold}
              </span>
          </div>
          <div className="absolute w-72 h-72 bg-blue-400 rounded-full opacity-10 animate-ping"></div>
      </div>
  );
};

const App: React.FC = () => {
  // --- Language State ---
  const [lang, setLang] = useState<'es' | 'en'>(() => {
    const saved = localStorage.getItem('breath_lang');
    if (saved === 'es' || saved === 'en') return saved;
    // Por defecto español
    return 'es';
  });

  const t = UI_TEXT[lang];

  // --- State ---
  const [screen, setScreen] = useState<Screen>(Screen.SETUP);
  const [config, setConfig] = useState<BreathConfig>({
    inhale: 4,
    exhale: 6,
    hold: 0,
    duration: 5,
    amplitude: 0.8
  });
  
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

  useEffect(() => {
    localStorage.setItem('breath_lang', lang);
  }, [lang]);

  // --- Optimization: Preload Images ---
  useEffect(() => {
    const preloadImages = () => {
      [IMG_ADRIANA, IMG_ARIEL].forEach(src => {
        const img = new Image();
        img.src = src;
      });
    };
    preloadImages();
  }, []);

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
      setTimeLeft(60); 
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
            setTipIndex(prev => (prev + 1) % MICRO_TIPS[lang].length);
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
  }, [isActive, config, screen, lang]);

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

  const LanguageSwitcher = () => (
    <div className="flex items-center justify-center bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-full w-fit mx-auto mb-4">
      <button 
        onClick={() => setLang('es')} 
        className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${lang === 'es' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
      >
        ESPAÑOL
      </button>
      <button 
        onClick={() => setLang('en')} 
        className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${lang === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
      >
        ENGLISH
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 relative ${theme.bg}`}>
      <main className="container mx-auto max-w-4xl min-h-screen">
        {screen === Screen.SETUP && (
          <div className="max-w-xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="text-center space-y-6">
              <h1 className={`text-4xl font-bold tracking-tight ${theme.textMain}`}>Emyti Holistic Healing</h1>
              <p className={`${theme.textMain} text-lg max-w-md mx-auto font-medium`}>
                {t.subtitle}
              </p>
              
              <div className="flex flex-col items-center gap-3 pt-2">
                <p className={`${theme.textDim} text-[10px] uppercase tracking-widest font-bold`}>{t.guides}</p>
                <div className="flex justify-center items-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500/30 shadow-lg bg-slate-300">
                      <img 
                        src={IMG_ADRIANA} 
                        alt="Dra. Adriana Ortiz" 
                        className="w-full h-full object-cover"
                        loading="eager"
                        {...({ fetchPriority: "high" } as any)}
                      />
                    </div>
                    <p className={`${theme.textMain} text-[10px] font-bold`}>Dra. Adriana Ortiz</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500/30 shadow-lg bg-slate-300">
                      <img 
                        src={IMG_ARIEL} 
                        alt="Ariel Reinaudo" 
                        className="w-full h-full object-cover"
                        loading="eager"
                        {...({ fetchPriority: "high" } as any)}
                      />
                    </div>
                    <p className={`${theme.textMain} text-[10px] font-bold`}>Ariel Reinaudo</p>
                  </div>
                </div>
              </div>
            </header>

            <section>
              <h2 className={`text-xs font-semibold uppercase tracking-wider ${theme.label} mb-4`}>{t.objective}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BREATH_PRESETS[lang].map(p => {
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
                    <label className={`block text-[10px] uppercase font-bold ${theme.label} mb-1`}>
                      {key === 'inhale' ? t.inhale : key === 'exhale' ? t.exhale : t.hold}
                    </label>
                    <input type="number" step="0.5" value={config[key as keyof BreathConfig] as number} onChange={e => setConfig({...config, [key]: parseFloat(e.target.value) || 0})} className={`w-full ${theme.input} rounded-lg p-2 text-center font-bold border`} />
                  </div>
                ))}
              </div>
              <div>
                <label className={`flex justify-between text-sm ${theme.label} mb-2`}><span>{t.amplitude}</span><span className={`font-bold ${theme.textMain}`}>{Math.round(config.amplitude * 100)}%</span></label>
                <input type="range" min="0.5" max="1" step="0.05" value={config.amplitude} onChange={e => setConfig({...config, amplitude: parseFloat(e.target.value)})} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div>
                <label className={`block text-sm ${theme.label} mb-2`}>{t.duration}</label>
                <div className="flex gap-2">
                  {DURATIONS.map(d => (
                    <button key={d} onClick={() => setConfig({...config, duration: d as any})} className={`flex-1 py-2 rounded-lg text-sm transition-all ${config.duration === d ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20' : `${theme.btnSecondary}`}`}>
                      {d === 'free' ? t.free : d}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="space-y-2 pt-4">
              <LanguageSwitcher />
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => startSession(true)} className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-bold ${prefs.darkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-blue-100 text-blue-600 hover:bg-blue-50'}`}>{t.calibrate}</button>
                <button onClick={() => startSession(false)} className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95">{t.start}</button>
              </div>
              
              <div className="flex flex-col items-center gap-6 pt-6">
                <div className="flex justify-center gap-6 items-center w-full">
                  <a 
                    href="https://webilution.ac-page.com/regulatuestres?test=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-semibold py-2 px-4 rounded-full border border-transparent transition-all hover:border-slate-300 dark:hover:border-slate-700 ${theme.textDim} hover:${theme.textMain}`}
                  >
                    {t.moreInfo}
                  </a>
                  <a 
                    href="https://content.app-us1.com/obmj7/2025/03/05/268c1b32-46aa-48ab-8640-a11e1ee25aa1.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-semibold py-2 px-4 rounded-full border border-transparent transition-all hover:border-slate-300 dark:hover:border-slate-700 ${theme.textDim} hover:${theme.textMain}`}
                  >
                    {t.freeEbook}
                  </a>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <p className={`text-[10px] text-center px-8 italic opacity-80 ${theme.textDim} leading-relaxed max-w-xs`}>
                    {t.recommendation}
                  </p>
                  <a 
                    href="https://calendly.com/adrianaortiz/regulatuestres?month=2026-02"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`py-3 px-8 rounded-2xl text-sm font-bold border transition-all hover:scale-[1.03] active:scale-95 shadow-sm ${prefs.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                  >
                    {t.schedule}
                  </a>
                  
                  <p className={`text-[9px] text-center px-4 mt-2 opacity-60 ${theme.textDim} leading-tight max-w-sm`}>
                    {t.disclaimer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {screen === Screen.CALIBRATION && (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-12">
            <header className="space-y-2">
              <h2 className={`text-2xl font-bold ${theme.textMain}`}>{t.calibTitle}</h2>
              <p className={theme.textDim}>{t.calibDesc}</p>
              <div className="inline-block px-4 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-mono text-sm font-bold">
                {t.timeLeft}: {timeLeft}s
              </div>
            </header>
            <BreathingCircle phase={phase} progress={progress} amplitude={config.amplitude} cycleCount={cycleCount} labels={{ inhale: t.inhale, exhale: t.exhale, hold: t.hold }} />
            <div className="w-full max-w-md space-y-6">
              <div className={`${theme.card} flex justify-between items-center p-4 rounded-2xl shadow-sm border`}>
                <button 
                  onClick={() => { 
                    setConfig(prev => ({ ...prev, inhale: prev.inhale + 0.5, exhale: prev.exhale + 0.5 })); 
                  }} 
                  className={`px-6 py-3 rounded-xl font-bold ${theme.btnSecondary}`}
                >
                  {t.slower}
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
                  {t.faster}
                </button>
              </div>
              <div className="flex gap-4">
                <button onClick={stopSession} className={`flex-1 py-4 border rounded-2xl font-medium ${theme.btnSecondary}`}>{t.back}</button>
                <button onClick={() => startSession(false)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">{t.start}</button>
              </div>
            </div>
          </div>
        )}

        {screen === Screen.SESSION && (
          <div className="flex flex-col items-center justify-between min-h-screen p-6 text-center">
            <div className="w-full flex justify-between items-center">
              <div className="text-left"><div className={`text-[10px] ${theme.label} font-bold uppercase tracking-widest`}>{t.cycles}</div><div className="text-2xl font-bold font-mono text-blue-600">{cycleCount}</div></div>
              <div className="text-right"><div className={`text-[10px] ${theme.label} font-bold uppercase tracking-widest`}>{t.remaining}</div><div className={`text-2xl font-bold font-mono ${theme.textMain}`}>{config.duration === 'free' ? '∞' : formatTime(timeLeft)}</div></div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center space-y-16 w-full">
              <BreathingCircle phase={phase} progress={progress} amplitude={config.amplitude} cycleCount={cycleCount} labels={{ inhale: t.inhale, exhale: t.exhale, hold: t.hold }} />
              <div className="w-full max-w-2xl px-4"><WaveCanvas phase={phase} progress={progress} inhaleTime={config.inhale} exhaleTime={config.exhale} holdTime={config.hold} reduceMotion={prefs.reduceMotion} darkMode={prefs.darkMode} /></div>
              <p className={`text-lg font-medium italic animate-in fade-in duration-1000 ${theme.textMain}`}>{MICRO_TIPS[lang][tipIndex]}</p>
            </div>
            <div className="w-full max-w-md flex gap-4 pt-8 pb-4">
              <button onClick={() => setIsActive(!isActive)} className={`flex-1 py-4 rounded-2xl font-bold transition-all active:scale-95 ${isActive ? theme.btnSecondary : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'}`}>{isActive ? t.pause : t.continue}</button>
              <button onClick={stopSession} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${theme.btnSecondary}`}>{t.exit}</button>
            </div>
          </div>
        )}

        {screen === Screen.SUMMARY && (
          <div className={`max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-6 space-y-12 text-center animate-in zoom-in-95 duration-500 ${theme.bg}`}>
            <h2 className={`text-3xl font-bold ${theme.textMain}`}>{t.wellDone}</h2>
            <div className={`${theme.card} p-8 rounded-3xl border shadow-xl w-full`}>
               <button onClick={stopSession} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl">{t.finish}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
