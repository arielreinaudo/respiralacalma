
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
    if (this.isMuted || this.isSilent) return;
    
    this.initContext();
    if (!this.context) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.context.currentTime + 0.05);

    // Incrementamos sustancialmente el multiplicador de ganancia de 0.4 a 0.8 
    // para maximizar el volumen en dispositivos móviles.
    gain.gain.setValueAtTime(this.volume * 0.8, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + 0.05);
  }
}

export const audioService = new AudioService();
