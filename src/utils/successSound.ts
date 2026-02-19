/**
 * Plays a pleasant success chime using the Web Audio API.
 * No external files needed – generates a multi-tone arpeggio.
 */
export function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);

    // Pleasant ascending arpeggio: C5, E5, G5, C6
    const frequencies = [523.25, 659.25, 783.99, 1046.50];
    const startTimes = [0, 0.12, 0.24, 0.38];

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      // Bell-like envelope
      const t = ctx.currentTime + startTimes[i];
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.6 - i * 0.1, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(t);
      osc.stop(t + 0.85);
    });

    // Final sparkle tone
    const sparkle = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkle.type = "triangle";
    sparkle.frequency.value = 1568; // G6
    const st = ctx.currentTime + 0.5;
    sparkleGain.gain.setValueAtTime(0, st);
    sparkleGain.gain.linearRampToValueAtTime(0.15, st + 0.03);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, st + 1.2);
    sparkle.connect(sparkleGain);
    sparkleGain.connect(masterGain);
    sparkle.start(st);
    sparkle.stop(st + 1.3);

    // Cleanup
    setTimeout(() => ctx.close(), 2500);
  } catch {
    // Audio API not available – silently ignore
  }
}
