import React, { useState } from 'react';
import styles from './css/app.module.scss';
import PomodoroTimer from './components/PomodoroTimer';
import SettingsPanel from './components/SettingsPanel';
import PlaylistPicker from './components/PlaylistPicker';
import { loadSettings, saveSettings, Settings } from './lib/storage';

type Tab = 'timer' | 'settings';

const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('timer');
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  const handleSettingsChange = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
  };

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <span className={styles.appName}>Focus Flow</span>
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
