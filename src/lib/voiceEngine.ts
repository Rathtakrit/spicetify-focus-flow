export type Phase = 'work' | 'shortBreak' | 'longBreak';

const MESSAGES: Record<Phase, (duration: number) => string> = {
  work: (d) => `Time to focus. ${d} minutes starting now.`,
  shortBreak: (d) => `Short break. ${d} minutes. Take a breath.`,
  longBreak: (d) => `Long break. ${d} minutes. Great work, you earned it.`,
};

export function announcePhase(phase: Phase, duration: number): void {
  if (!window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(MESSAGES[phase](duration));
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  window.speechSynthesis.speak(utterance);
}
