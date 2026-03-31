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

const RING_R = 108;
const RING_C = 2 * Math.PI * RING_R;

const PomodoroTimer: React.FC<Props> = ({ settings }) => {
  const [phase, setPhase] = useState<Phase>('work');
  const [secondsLeft, setSecondsLeft] = useState(settings.workDuration * 60);
  const [totalSeconds, setTotalSeconds] = useState(settings.workDuration * 60);
  const [status, setStatus] = useState<Status>('idle');
  const [sessionCount, setSessionCount] = useState(0);
  const [spotifyPlaying, setSpotifyPlaying] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<{ title: string; artist: string } | null>(null);

  // Sync with Spotify play state + track info
  useEffect(() => {
    const syncPlayState = () => {
      try { setSpotifyPlaying(Spicetify.Player.isPlaying()); } catch { /* noop */ }
    };
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

    syncPlayState();
    syncTrack();

    Spicetify.Player.addEventListener('onplaypause', syncPlayState);
    Spicetify.Player.addEventListener('songchange', syncTrack);
    return () => {
      Spicetify.Player.removeEventListener('onplaypause', syncPlayState);
      Spicetify.Player.removeEventListener('songchange', syncTrack);
    };
  }, []);

  // Sync timer when settings change while idle
  useEffect(() => {
    if (status === 'idle') {
      const s = getPhaseDuration(phase, settings) * 60;
      setSecondsLeft(s);
      setTotalSeconds(s);
    }
  }, [status, phase, settings.workDuration, settings.shortBreak, settings.longBreak]);

  function getPhaseDuration(p: Phase, s: Settings): number {
    if (p === 'work') return s.workDuration;
    if (p === 'shortBreak') return s.shortBreak;
    return s.longBreak;
  }

  const transitionToNextPhase = useCallback(() => {
    setSessionCount((prevCount) => {
      const newCount = phase === 'work' ? prevCount + 1 : prevCount;
      const nextPhase: Phase =
        phase !== 'work'
          ? 'work'
          : newCount % settings.sessionsBeforeLong === 0
          ? 'longBreak'
          : 'shortBreak';

      const duration = getPhaseDuration(nextPhase, settings);
      setPhase(nextPhase);
      setSecondsLeft(duration * 60);
      setTotalSeconds(duration * 60);
      setStatus(settings.autoStart ? 'running' : 'idle');

      if (settings.bellEnabled) playBell(settings.bellVolume);
      if (settings.voiceEnabled) announcePhase(nextPhase, duration);
      Spicetify.showNotification(`${PHASE_LABELS[nextPhase]} — ${duration} min`);

      return newCount;
    });
  }, [phase, settings]);

  // Countdown — interval only counts, never reads phase/session state
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  // Phase transition when countdown hits zero
  useEffect(() => {
    if (secondsLeft === 0 && status === 'running') {
      transitionToNextPhase();
    }
  }, [secondsLeft, status, transitionToNextPhase]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const dashOffset = RING_C * (1 - progress);

  const phaseGradientId = 'timerGrad';
  const isWork = phase === 'work';
  const ringColor = isWork ? '#6366f1' : '#14b8a6';

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

  const handleSkip = () => {
    setStatus('idle');
    transitionToNextPhase();
  };

  const completedDots = sessionCount % settings.sessionsBeforeLong;

  return (
    <div className={styles.timerCard}>
      {/* Ambient glow behind ring */}
      <div className={`${styles.ambientGlow} ${isWork ? styles.ambientGlowWork : styles.ambientGlowBreak}`} />

      <div className={styles.phaseLabel}>{PHASE_LABELS[phase]}</div>

      {/* Ring */}
      <div className={styles.ringWrap}>
        <svg width="260" height="260" viewBox="0 0 260 260" className={styles.ringsvg}>
          <defs>
            <linearGradient id={phaseGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWork ? '#818cf8' : '#2dd4bf'} />
              <stop offset="100%" stopColor={ringColor} />
            </linearGradient>
            <filter id="ringGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle cx="130" cy="130" r={RING_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="130" cy="130" r={RING_R}
            fill="none"
            stroke={`url(#${phaseGradientId})`}
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

      {/* Session dots */}
      <div className={styles.sessionDots}>
        {Array.from({ length: settings.sessionsBeforeLong }, (_, i) => (
          <span key={i} className={`${styles.dot} ${i < completedDots ? styles.dotFilled : ''}`} />
        ))}
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button className={styles.ctrlBtn} onClick={handleReset} title="Reset">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
          </svg>
        </button>
        <button className={`${styles.ctrlBtn} ${styles.ctrlBtnMain}`} onClick={handlePlayPause}>
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
        <button className={styles.ctrlBtn} onClick={handleSkip} title="Skip phase">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
