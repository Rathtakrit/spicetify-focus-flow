import React, { useState, useCallback } from 'react';
import styles from './css/app.module.scss';
import PomodoroTimer from './components/PomodoroTimer';
import SettingsPanel from './components/SettingsPanel';
import PlaylistPicker from './components/PlaylistPicker';
import { loadSettings, saveSettings, Settings } from './lib/storage';

type Tab = 'timer' | 'settings';

// Simple clock-flow logo
const Logo: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Focus Flow">
    <circle cx="14" cy="14" r="12" stroke="#6366f1" strokeWidth="2"/>
    <circle cx="14" cy="14" r="12" stroke="url(#logoGrad)" strokeWidth="2"
      strokeDasharray="37.7 37.7" strokeLinecap="round" transform="rotate(-90 14 14)"/>
    <line x1="14" y1="14" x2="14" y2="6" stroke="#818cf8" strokeWidth="2" strokeLinecap="round"/>
    <line x1="14" y1="14" x2="19" y2="17" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="14" cy="14" r="1.5" fill="#818cf8"/>
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818cf8"/>
        <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
      </linearGradient>
    </defs>
  </svg>
);

const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('timer');
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  const handleSettingsChange = useCallback((s: Settings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  return (
    <div className={styles.app}>
      {/* Ambient background orbs */}
      <div className={styles.orbA} />
      <div className={styles.orbB} />

      <div className={styles.header}>
        <div className={styles.logoGroup}>
          <Logo />
          <span className={styles.appName}>Focus Flow</span>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'timer' ? styles.tabActive : ''}`}
            onClick={() => setTab('timer')}
          >
            Timer
          </button>
          <button
            className={`${styles.tab} ${tab === 'settings' ? styles.tabActive : ''}`}
            onClick={() => setTab('settings')}
          >
            Settings
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {tab === 'timer' ? (
          <>
            <PomodoroTimer settings={settings} />
            <PlaylistPicker
              selected={settings.focusLevel}
              onChange={(id) => handleSettingsChange({ ...settings, focusLevel: id })}
            />
          </>
        ) : (
          <SettingsPanel settings={settings} onChange={handleSettingsChange} />
        )}
      </div>
    </div>
  );
};

export default App;
