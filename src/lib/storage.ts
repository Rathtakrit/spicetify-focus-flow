const SETTINGS_KEY = 'focus-flow:settings';

export interface Settings {
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLong: number;
  bellEnabled: boolean;
  bellVolume: number;
  voiceEnabled: boolean;
  autoStart: boolean;
  focusLevel: string;
}

export const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLong: 4,
  bellEnabled: true,
  bellVolume: 0.7,
  voiceEnabled: true,
  autoStart: false,
  focusLevel: 'deep',
};

export function loadSettings(): Settings {
  try {
    const raw = Spicetify.LocalStorage.get(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  Spicetify.LocalStorage.set(SETTINGS_KEY, JSON.stringify(s));
}
