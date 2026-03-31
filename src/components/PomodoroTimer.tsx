import React, { useState, useEffect, useCallback } from 'react';
import styles from '../css/app.module.scss';
import { Settings } from '../lib/storage';
import { playBell } from '../lib/soundEngine';
import { announcePhase, Phase } from '../lib/voiceEngine';

interface Props {
  settings: Settings;
}

type Status = 'idle' | 'running' | 'paused';

const PHASE_LABELS: Record<Phase, string> = {
  work: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

const RING_RADIUS = 88;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const PomodoroTimer: React.FC<Props> = ({ settings }) => {
  const [phase, setPhase] = useState<Phase>('work');
  const [secondsLeft, setSecondsLeft] = useState(settings.workDuration * 60);
  const [totalSeconds, setTotalSeconds] = useState(settings.workDuration * 60);
  const [status, setStatus] = useState<Status>('idle');
  const [sessionCount, setSessionCount] = useState(0);

  // Keep secondsLeft in sync when settings change while idle
  useEffect(() => {
    if (status === 'idle') {
      const s = getPhaseDuration(phase, settings) * 60;
      setSecondsLeft(s);
      setTotalSeconds(s);
    }
  }, [settings.workDuration, settings.shortBreak, settings.longBreak]);

  function getPhaseDuration(p: Phase, s: Settings): number {
    if (p === 'work') return s.workDuration;
    if (p === 'shortBreak') return s.shortBreak;
    return s.longBreak;
  }

  const transitionToNextPhase = useCallback(() => {
    let nextPhase: Phase;
    let nextSessionCount = sessionCount;

    if (phase === 'work') {
      nextSessionCount = sessionCount + 1;
      setSessionCount(nextSessionCount);
      if (nextSessionCount % settings.sessionsBeforeLong === 0) {
        nextPhase = 'longBreak';
      } else {
        nextPhase = 'shortBreak';
      }
    } else {
      nextPhase = 'work';
    }

    const duration = getPhaseDuration(nextPhase, settings);
    setPhase(nextPhase);
    setSecondsLeft(duration * 60);
    setTotalSeconds(duration * 60);

    if (settings.bellEnabled) playBell(settings.bellVolume);
    if (settings.voiceEnabled) announcePhase(nextPhase, duration);
    Spicetify.showNotification(`${PHASE_LABELS[nextPhase]} — ${duration} min`);

    setStatus(settings.autoStart ? 'running' : 'idle');
  }, [phase, sessionCount, settings]);

  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          transitionToNextPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, transitionToNextPhase]);

  const formatTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  const phaseColor = phase === 'work' ? 'var(--spice-button)' : '#1db954';

  const handleStartPause = () => {
    if (status === 'running') {
      setStatus('paused');
    } else {
      setStatus('running');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    const s = getPhaseDuration(phase, settings) * 60;
    setSecondsLeft(s);
    setTotalSeconds(s);
  };

  const handleSkip = () => {
    setStatus('idle');
    transitionToNextPhase();
  };

  const dots = Array.from({ length: settings.sessionsBeforeLong }, (_, i) => (
    <span
      key={i}
      className={`${styles.sessionDot} ${i < (sessionCount % settings.sessionsBeforeLong || (sessionCount > 0 && sessionCount % settings.sessionsBeforeLong === 0 ? settings.sessionsBeforeLong : 0)) ? styles.sessionDotFilled : ''}`}
    />
  ));

  return (
    <div className={styles.timerPage}>
      <div className={styles.phaseLabel}>{PHASE_LABELS[phase]}</div>

      <div className={styles.ringWrap}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle
            cx="100" cy="100" r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <circle
            cx="100" cy="100" r={RING_RADIUS}
            fill="none"
            stroke={phaseColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s' }}
          />
        </svg>
        <div className={styles.ringTime}>{formatTime(secondsLeft)}</div>
      </div>

      <div className={styles.sessionDots}>{dots}</div>

      <div className={styles.timerControls}>
        <button className={styles.controlBtn} onClick={handleReset} title="Reset">
          ↺
        </button>
        <button className={`${styles.controlBtn} ${styles.controlBtnPrimary}`} onClick={handleStartPause}>
          {status === 'running' ? '⏸' : '▶'}
        </button>
        <button className={styles.controlBtn} onClick={handleSkip} title="Skip">
          ⏭
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
