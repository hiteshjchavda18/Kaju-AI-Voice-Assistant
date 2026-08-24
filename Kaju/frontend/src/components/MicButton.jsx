import React, { useState, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

export function MicButton({ isRecording, isProcessing, onToggleRecord }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <button
        onClick={onToggleRecord}
        disabled={isProcessing}
        className={`mic-big-btn ${isRecording ? 'recording' : ''}`}
        title={isRecording ? 'Click to stop speaking' : 'Click to start speaking'}
      >
        {isProcessing ? (
          <Loader2 size={36} className="animate-spin" />
        ) : isRecording ? (
          <Square size={30} fill="#fff" />
        ) : (
          <Mic size={36} />
        )}
      </button>

      {isRecording && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(239, 68, 68, 0.2)',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          fontSize: '0.85rem',
          fontWeight: '600',
          color: '#f87171'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ef4444',
            display: 'inline-block'
          }}></span>
          <span>{formatTime(seconds)} • Recording</span>
        </div>
      )}
    </div>
  );
}
