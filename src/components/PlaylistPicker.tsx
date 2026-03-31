import React from 'react';
import styles from '../css/app.module.scss';

interface FocusLevel {
  id: string;
  emoji: string;
  name: string;
  description: string;
  uri: string;
}

const FOCUS_LEVELS: FocusLevel[] = [
  {
    id: 'chill',
    emoji: '🌊',
    name: 'Chill',
    description: 'Light background, minimal distraction',
    uri: 'spotify:playlist:37i9dQZF1DX3Ogo9pFvBkY',
  },
  {
    id: 'deep',
    emoji: '🎯',
    name: 'Deep Focus',
    description: 'Instrumental, no lyrics',
    uri: 'spotify:playlist:37i9dQZF1DWZeKCadgRdKQ',
  },
  {
    id: 'creative',
    emoji: '🎨',
    name: 'Creative',
    description: 'Jazz & ambient electronic',
    uri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO',
  },
  {
    id: 'power',
    emoji: '⚡',
    name: 'Power',
    description: 'Energetic instrumental & game OSTs',
    uri: 'spotify:playlist:37i9dQZF1DX1s9knjP51Oa',
  },
];

interface Props {
  selected: string;
  onChange: (id: string) => void;
}

const PlaylistPicker: React.FC<Props> = ({ selected, onChange }) => {
  const handleClick = (level: FocusLevel) => {
    onChange(level.id);
    try {
      Spicetify.Player.playUri(level.uri);
    } catch {
      Spicetify.showNotification(`Playing ${level.name} playlist`);
    }
  };

  return (
    <div className={styles.pickerSection}>
      <div className={styles.sectionTitle}>Focus Level</div>
      <div className={styles.levelGrid}>
        {FOCUS_LEVELS.map((level) => (
          <button
            key={level.id}
            className={`${styles.levelCard} ${selected === level.id ? styles.levelCardActive : ''}`}
            onClick={() => handleClick(level)}
          >
            <span className={styles.levelEmoji}>{level.emoji}</span>
            <span className={styles.levelName}>{level.name}</span>
            <span className={styles.levelDesc}>{level.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlaylistPicker;
