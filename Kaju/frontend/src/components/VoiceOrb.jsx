import React, { useEffect, useRef } from 'react';
import { Mic, Volume2, Sparkles, Loader2 } from 'lucide-react';

export function VoiceOrb({ status, volume = 0, frequencyData, onOrbClick, liveTranscript }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let angle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Base radius based on status & volume
      let baseRadius = 65;
      if (status === 'listening') {
        baseRadius = 65 + volume * 55;
      } else if (status === 'speaking') {
        baseRadius = 65 + Math.sin(angle * 3) * 8 + volume * 35;
      } else if (status === 'thinking') {
        baseRadius = 65 + Math.sin(angle * 4) * 6;
      }

      // 1. Draw outer glowing harmonic waves
      const numWaves = status === 'listening' || status === 'speaking' ? 3 : 2;
      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        const waveRadius = baseRadius + (i + 1) * (18 + volume * 25);
        ctx.arc(centerX, centerY, Math.max(10, waveRadius), 0, Math.PI * 2);

        if (status === 'listening') {
          ctx.strokeStyle = `rgba(244, 63, 94, ${0.45 - i * 0.12 + volume * 0.3})`;
        } else if (status === 'speaking') {
          ctx.strokeStyle = `rgba(192, 132, 252, ${0.55 - i * 0.12 + volume * 0.3})`;
        } else if (status === 'thinking') {
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 - i * 0.1})`;
        } else {
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.28 - i * 0.08})`;
        }

        ctx.lineWidth = 1.8 + (i === 0 ? volume * 3 : 0.8);
        ctx.stroke();
      }

      // 2. Draw frequency spikes around the orb
      if (frequencyData && (status === 'listening' || status === 'speaking')) {
        const bars = 48;
        const step = (Math.PI * 2) / bars;
        ctx.beginPath();
        for (let i = 0; i < bars; i++) {
          const val = frequencyData[i % frequencyData.length] || 0;
          const barHeight = (val / 255) * 35 * (volume + 0.3);
          const currentAngle = i * step + angle;

          const x1 = centerX + Math.cos(currentAngle) * (baseRadius + 4);
          const y1 = centerY + Math.sin(currentAngle) * (baseRadius + 4);
          const x2 = centerX + Math.cos(currentAngle) * (baseRadius + 4 + barHeight);
          const y2 = centerY + Math.sin(currentAngle) * (baseRadius + 4 + barHeight);

          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.strokeStyle = status === 'listening' ? '#fb7185' : '#d8b4fe';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      angle += 0.025;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [status, volume, frequencyData]);

  const getStatusBadge = () => {
    switch (status) {
      case 'listening':
        return (
          <div className="status-pill" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.12)' }}>
            <span className="status-dot listening"></span>
            <span style={{ color: '#fda4af' }}>Listening... Speak into mic</span>
          </div>
        );
      case 'thinking':
        return (
          <div className="status-pill" style={{ borderColor: 'rgba(192, 132, 252, 0.4)', background: 'rgba(168, 85, 247, 0.12)' }}>
            <Loader2 size={12} className="animate-spin" style={{ color: '#c084fc' }} />
            <span style={{ color: '#e9d5ff' }}>Kaju is thinking...</span>
          </div>
        );
      case 'speaking':
        return (
          <div className="status-pill" style={{ borderColor: 'rgba(168, 85, 247, 0.5)', background: 'rgba(168, 85, 247, 0.18)' }}>
            <Volume2 size={12} style={{ color: '#d8b4fe' }} />
            <span style={{ color: '#f3e8ff' }}>Speaking...</span>
          </div>
        );
      default:
        return (
          <div className="status-pill">
            <span className="status-dot active"></span>
            <span style={{ color: '#d8b4fe' }}>Ready • Click to Talk</span>
          </div>
        );
    }
  };

  return (
    <div className="voice-orb-container" style={{ textAlign: 'center', padding: '16px 0' }}>
      <div className="orb-canvas-wrapper" onClick={onOrbClick} style={{ cursor: 'pointer' }}>
        {/* Glow backdrop layer */}
        <div className={`orb-glow ${status}`}></div>

        {/* Canvas for dynamic reactive waves */}
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
        />

        {/* Core Center Sphere */}
        <div
          className="orb-core"
          style={{
            transform: `scale(${1 + volume * 0.22})`,
            background:
              status === 'listening'
                ? 'linear-gradient(135deg, #f43f5e 0%, #be123c 50%, #7e22ce 100%)'
                : status === 'speaking'
                ? 'linear-gradient(135deg, #e9d5ff 0%, #a855f7 50%, #581c87 100%)'
                : status === 'thinking'
                ? 'linear-gradient(135deg, #c084fc 0%, #7c3aed 50%, #4338ca 100%)'
                : 'linear-gradient(135deg, #e9d5ff 0%, #9333ea 50%, #581c87 100%)'
          }}
        >
          {status === 'listening' ? (
            <Mic size={40} color="#fff" />
          ) : status === 'speaking' ? (
            <Volume2 size={40} color="#fff" />
          ) : status === 'thinking' ? (
            <Sparkles size={40} color="#fff" />
          ) : (
            <span style={{ fontSize: '2.4rem' }}>🎙️</span>
          )}
        </div>
      </div>

      <div style={{ marginTop: '22px' }}>
        {getStatusBadge()}
      </div>

      {/* Live Speech Recognition Feedback */}
      {status === 'listening' && liveTranscript && (
        <div style={{
          marginTop: '14px',
          padding: '8px 18px',
          background: 'rgba(26, 17, 44, 0.75)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: 'var(--radius-md)',
          maxWidth: '380px',
          fontSize: '0.88rem',
          color: '#f3e8ff',
          fontStyle: 'italic',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          "{liveTranscript}"
        </div>
      )}
    </div>
  );
}
