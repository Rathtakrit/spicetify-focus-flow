let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

function playNote(
  audioCtx: AudioContext,
  frequency: number,
  startTime: number,
  volume: number
): void {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

  oscillator.start(startTime);
  oscillator.stop(startTime + 0.7);
}

export function playBell(volume: number = 0.7): void {
  const audioCtx = getCtx();
  if (!audioCtx) return;

  // Resume suspended context (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  // A major chord arpeggio: A5 → C#6 → E6
  playNote(audioCtx, 880, now, volume);
  playNote(audioCtx, 1108.7, now + 0.18, volume * 0.85);
  playNote(audioCtx, 1318.5, now + 0.36, volume * 0.7);
}
