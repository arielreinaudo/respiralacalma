
export class AudioService {
  private context: AudioContext | null = null;
  private volume: number = 1.0;
  private isMuted: boolean = false;
  private isSilent: boolean = false;

  constructor() {
    // Context is initialized on first user interaction
  }

  private initContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  updateSettings(volume: number, isMuted: boolean, isSilent: boolean) {
    this.volume = volume;
    this.isMuted = isMuted;
    this.isSilent = isSilent;
  }

  playClick() {
    if (this.isMuted || this.isSilent || this.volume <= 0.01) return;
    
    this.initContext();
    if (!this.context) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    // Sonido tipo "latido" (pulso suave de baja frecuencia)
    // Es más relajante y menos intrusivo que un click metálico
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.context.currentTime + 0.15);

    gain.gain.setValueAtTime(this.volume * 1.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + 0.15);
  }
}

export const audioService = new AudioService();
