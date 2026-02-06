
import React, { useEffect, useRef } from 'react';
import { Phase } from '../types';

interface WaveCanvasProps {
  phase: Phase;
  progress: number;
  inhaleTime: number;
  exhaleTime: number;
  holdTime: number;
  reduceMotion: boolean;
  darkMode: boolean;
}

const WaveCanvas: React.FC<WaveCanvasProps> = ({ 
  phase, 
  progress, 
  inhaleTime, 
  exhaleTime, 
  holdTime,
  reduceMotion,
  darkMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const textColor = darkMode ? '#475569' : '#cbd5e1';

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      if (reduceMotion) {
          ctx.beginPath();
          ctx.lineWidth = 4;
          ctx.strokeStyle = textColor;
          ctx.moveTo(50, height/2);
          ctx.lineTo(width - 50, height/2);
          ctx.stroke();

          const dotX = 50 + (width - 100) * (phase === Phase.INHALE ? progress * 0.4 : phase === Phase.EXHALE ? 0.4 + progress * 0.4 : 0.8 + progress * 0.2);
          ctx.beginPath();
          ctx.fillStyle = '#3b82f6';
          ctx.arc(dotX, height/2, 10, 0, Math.PI * 2);
          ctx.fill();
          return;
      }

      const totalTime = inhaleTime + exhaleTime + holdTime;
      const centerY = height / 2;
      const amplitude = height * 0.35;

      // Draw sine wave path
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = textColor;
      ctx.setLineDash([5, 5]);

      // Draw until width - 2 to avoid the vertical edge artifact
      for (let x = 0; x < width - 1; x++) {
        const t = (x / width) * totalTime;
        let y = centerY;

        if (t < inhaleTime) {
          const phaseProgress = t / inhaleTime;
          y = centerY + amplitude * Math.cos(Math.PI * (phaseProgress + 1));
        } else if (t < inhaleTime + exhaleTime) {
          const phaseProgress = (t - inhaleTime) / exhaleTime;
          y = centerY + amplitude * Math.cos(Math.PI * phaseProgress);
        } else {
          y = centerY + amplitude;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Calculate current position
      let currentX = 0;
      let currentY = centerY;

      if (phase === Phase.INHALE) {
        currentX = (progress * inhaleTime / totalTime) * width;
        currentY = centerY + amplitude * Math.cos(Math.PI * (progress + 1));
      } else if (phase === Phase.EXHALE) {
        currentX = ((inhaleTime + progress * exhaleTime) / totalTime) * width;
        currentY = centerY + amplitude * Math.cos(Math.PI * progress);
      } else {
        currentX = ((inhaleTime + exhaleTime + progress * holdTime) / totalTime) * width;
        currentY = centerY + amplitude;
      }

      // Ensure currentX is within bounds for rendering the dot correctly
      currentX = Math.min(width - 8, Math.max(8, currentX));

      // Draw glow
      ctx.beginPath();
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
      ctx.fillStyle = '#3b82f6';
      ctx.arc(currentX, currentY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    draw();
  }, [phase, progress, inhaleTime, exhaleTime, holdTime, reduceMotion, darkMode]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={150} 
      className="w-full max-w-2xl h-auto"
    />
  );
};

export default WaveCanvas;
