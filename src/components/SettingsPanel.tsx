import React from 'react';
import styles from '../css/app.module.scss';
import { Settings } from '../lib/storage';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

const NumberField: React.FC<NumberFieldProps> = ({ label, value, min, max, onChange }) => (
  <div className={styles.settingRow}>
    <label className={styles.settingLabel}>{label}</label>
    <div className={styles.settingControl}>
      <button
        className={styles.stepBtn}
        onClick={() => onChange(Math.max(min, value - 1))}
      >−</button>
      <span className={styles.settingValue}>{value}m</span>
      <button
        className={styles.stepBtn}
        onClick={() => onChange(Math.min(max, value + 1))}
      >+</button>
    </div>
  </div>
);

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange }) => (
  <div className={styles.settingRow}>
    <label className={styles.settingLabel}>{label}</label>
    <button
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className={styles.toggleThumb} />
    </button>
  </div>
);

const SettingsPanel: React.FC<Props> = ({ settings, onChange }) => {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.settingsGroup}>
        <div className={styles.groupTitle}>Timer Durations</div>
        <NumberField label="Work" value={settings.workDuration} min={1} max={60} onChange={(v) => set('workDuration', v)} />
        <NumberField label="Short Break" value={settings.shortBreak} min={1} max={30} onChange={(v) => set('shortBreak', v)} />
        <NumberField label="Long Break" value={settings.longBreak} min={5} max={60} onChange={(v) => set('longBreak', v)} />
        <NumberField label="Sessions before long break" value={settings.sessionsBeforeLong} min={1} max={8} onChange={(v) => set('sessionsBeforeLong', v)} />
      </div>

      <div className={styles.settingsGroup}>
        <div className={styles.groupTitle}>Notifications</div>
        <Toggle label="Bell chime" checked={settings.bellEnabled} onChange={(v) => set('bellEnabled', v)} />
        {settings.bellEnabled && (
          <div className={styles.settingRow}>
            <label className={styles.settingLabel}>Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.bellVolume}
              className={styles.slider}
              onChange={(e) => set('bellVolume', parseFloat(e.target.value))}
            />
          </div>
        )}
        <Toggle label="Voice announcement" checked={settings.voiceEnabled} onChange={(v) => set('voiceEnabled', v)} />
      </div>

      <div className={styles.settingsGroup}>
        <div className={styles.groupTitle}>Behaviour</div>
        <Toggle label="Auto-start next session" checked={settings.autoStart} onChange={(v) => set('autoStart', v)} />
      </div>
    </div>
  );
};

export default SettingsPanel;
