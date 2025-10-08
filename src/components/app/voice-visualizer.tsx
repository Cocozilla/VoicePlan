
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from "framer-motion";


interface VoiceVisualizerProps {
  status: 'recording' | 'processing';
  audioStream: MediaStream | null;
}

const WaveformLoader = ({ brandColor }: { brandColor: string }) => {
  const bars = Array.from({ length: 12 });
  return (
    <div className="flex items-end justify-center gap-1 h-32">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-full"
          style={{ background: brandColor }}
          initial={{ height: 10 }}
          animate={{
            height: [10, 60, 20, 45, 15],
          }}
          transition={{
            duration: 1.2,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}


export function VoiceVisualizer({ status, audioStream }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const [themeColors, setThemeColors] = useState({ primary: '#673AB7', accent: '#3F51B5' });

  const getCssVariableValue = (variable: string) => {
    if (typeof window === 'undefined') return '';
    const val = getComputedStyle(document.body).getPropertyValue(variable).trim();
    if (val.includes(' ')) { // It's HSL
        const [h, s, l] = val.split(' ').map(v => parseFloat(v));
        const sNorm = s / 100;
        const lNorm = l / 100;
        const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = lNorm - c / 2;
        let r = 0, g = 0, b = 0;

        if (h < 60) { [r,g,b] = [c,x,0]; } 
        else if (h < 120) { [r,g,b] = [x,c,0]; } 
        else if (h < 180) { [r,g,b] = [0,c,x]; } 
        else if (h < 240) { [r,g,b] = [0,x,c]; } 
        else if (h < 300) { [r,g,b] = [x,0,c]; } 
        else { [r,g,b] = [c,0,x]; }

        const toHex = (val: number) => {
            const hex = Math.round((val + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    return val;
  }

   useEffect(() => {
        const primary = getCssVariableValue('--primary');
        const accent = getCssVariableValue('--accent');
        if (primary && accent) {
            setThemeColors({ primary, accent });
        }
  }, []);

  // Recording waveform effect
  useEffect(() => {
    if (status !== 'recording' || !audioStream || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    let audioContext: AudioContext;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch(e) {
        console.error("Web Audio API is not supported in this browser.");
        return;
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameId.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 2;

      const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, themeColors.primary);
      gradient.addColorStop(1, themeColors.accent);
      canvasCtx.strokeStyle = gradient;

      canvasCtx.beginPath();
      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if(audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [status, audioStream, themeColors]);

  if (status === 'recording') {
    return <canvas ref={canvasRef} width="600" height="150" className="w-full max-w-md" />;
  }

  if (status === 'processing') {
     return (
      <div className="w-48 h-48 flex items-center justify-center">
        <WaveformLoader brandColor={themeColors.primary} />
      </div>
    );
  }

  return null;
}
