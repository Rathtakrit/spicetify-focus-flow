import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const RING_R = 108;
const RING_C = 2 * Math.PI * RING_R;

function getPhaseDuration(p: Phase, s: Settings): number {
  if (p === 'work') return s.workDuration;
  if (p === 'shortBreak') return s.shortBreak;
  return s.longBreak;
}

const PomodoroTimer: React.FC<Props> = ({ settings }) => {
  const [phase, setPhase] = useState<Phase>('work');
  const [secondsLeft, setSecondsLeft] = useState(settings.workDuration * 60);
  const [totalSeconds, setTotalSeconds] = useState(settings.workDuration * 60);
  const [status, setStatus] = useState<Status>('idle');
  const [sessionCount, setSessionCount] = useState(0);
  const [nowPlaying, setNowPlaying] = useState<{ title: string; artist: string } | null>(null);

  // Always-current refs — let transition callback read live values without deps
  const phaseRef = useRef(phase);
  const sessionCountRef = useRef(sessionCount);
  const settingsRef = useRef(settings);
  const statusRef = useRef(status);
  phaseRef.current = phase;
  sessionCountRef.current = sessionCount;
  settingsRef.current = settings;
  statusRef.current = status;

  // Sync Spotify track info
  useEffect(() => {
    const syncTrack = () => {
      try {
        const data = Spicetify.Player.data;
        if (data?.item) {
          setNowPlaying({
            title: data.item.name ?? '',
            artist: (data.item.artists ?? []).map((a: any) => a.name).join(', '),
          });
        }
      } catch { /* noop */ }
    };
    syncTrack();
    Spicetify.Player.addEventListener('songchange', syncTrack);
    return () => Spicetify.Player.removeEventListener('songchange', syncTrack);
  }, []);

  // Sync timer display when settings change while idle
  useEffect(() => {
    if (statusRef.current === 'idle') {
      const s = getPhaseDuration(phase, settings) * 60;
      setSecondsLeft(s);
      setTotalSeconds(s);
    }
  }, [settings.workDuration, settings.shortBreak, settings.longBreak, phase]);

  // Stable phase transition — reads everything from refs, zero deps
  const doTransition = useCallback(() => {
    const s = settingsRef.current;
    const curPhase = phaseRef.current;
    const curCount = sessionCountRef.current;

    const newCount = curPhase === 'work' ? curCount + 1 : curCount;
    const nextPhase: Phase =
      curPhase !== 'work'
        ? 'work'
        : newCount % s.sessionsBeforeLong === 0
        ? 'longBreak'
        : 'shortBreak';

    const duration = getPhaseDuration(nextPhase, s);

    setSessionCount(newCount);
    setPhase(nextPhase);
    setSecondsLeft(duration * 60);
    setTotalSeconds(duration * 60);
    setStatus(s.autoStart ? 'running' : 'idle');

    if (s.bellEnabled) playBell(s.bellVolume);
    if (s.voiceEnabled) announcePhase(nextPhase, duration);
    Spicetify.showNotification(`${PHASE_LABELS[nextPhase]} — ${duration} min`);
  }, []); // stable — no deps needed

  // Countdown interval
  useEffect(() => {
    if (status !== 'running') return;

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          // Schedule transition outside the state updater
          setTimeout(doTransition, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [status, doTransition]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const dashOffset = RING_C * (1 - progress);
  const isWork = phase === 'work';

  const handlePlayPause = () => {
    try { Spicetify.Player.togglePlay(); } catch { /* noop */ }
    setStatus((s) => (s === 'running' ? 'paused' : 'running'));
  };

  const handleReset = () => {
    setStatus('idle');
    const s = getPhaseDuration(phase, settings) * 60;
    setSecondsLeft(s);
    setTotalSeconds(s);
  };

  // Session dots: how many work sessions completed in current cycle
  const dotsTotal = settings.sessionsBeforeLong;
  const dotsFilled = sessionCount % dotsTotal;

  return (
    <div className={styles.timerCard}>
      <div className={`${styles.ambientGlow} ${isWork ? styles.ambientGlowWork : styles.ambientGlowBreak}`} />

      <div className={styles.phaseLabel}>{PHASE_LABELS[phase]}</div>

      <div className={styles.ringWrap}>
        <svg width="260" height="260" viewBox="0 0 260 260" className={styles.ringsvg}>
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWork ? '#818cf8' : '#2dd4bf'} />
              <stop offset="100%" stopColor={isWork ? '#6366f1' : '#14b8a6'} />
            </linearGradient>
            <filter id="ringGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <circle cx="130" cy="130" r={RING_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle
            cx="130" cy="130" r={RING_R}
            fill="none"
            stroke="url(#timerGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 130 130)"
            filter="url(#ringGlow)"
            style={{ transition: 'stroke-dashoffset 0.95s linear' }}
          />
        </svg>

        <div className={styles.ringCenter}>
          <div className={styles.ringTime}>{fmt(secondsLeft)}</div>
          {nowPlaying && (
            <div className={styles.nowPlaying}>
              <span className={styles.nowPlayingTitle}>{nowPlaying.title}</span>
              <span className={styles.nowPlayingArtist}>{nowPlaying.artist}</span>
            </div>
          )}
        </div>
      </div>

      {/* Session progress dots */}
      <div className={styles.sessionDots}>
        {Array.from({ length: dotsTotal }, (_, i) => (
          <span key={i} className={`${styles.dot} ${i < dotsFilled ? styles.dotFilled : ''}`} />
        ))}
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.ctrlBtn} onClick={handleReset} title="Reset">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
          </svg>
        </button>
        <button type="button" className={`${styles.ctrlBtn} ${styles.ctrlBtnMain}`} onClick={handlePlayPause}>
          {status === 'running' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>
        <button type="button" className={styles.ctrlBtn} onClick={doTransition} title="Skip phase">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
