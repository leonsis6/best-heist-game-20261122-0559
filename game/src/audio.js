// Synthesized sound: every effect is a WebAudio oscillator, no audio files.
// Silent until the first key or click unlocks the audio context.

export function createAudio() {
  let ctx = null;
  let sirenOsc = null;
  let sirenGain = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, gainValue, slideTo) {
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    gain.gain.setValueAtTime(gainValue || 0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  }

  return {
    unlock() { ensure(); },
    pickup() { tone(880, 0.12, 'sine', 0.09); setTimeout(() => tone(1320, 0.16, 'sine', 0.09), 70); },
    diamond() { tone(660, 0.14, 'triangle', 0.1); setTimeout(() => tone(990, 0.14, 'triangle', 0.1), 90); setTimeout(() => tone(1320, 0.24, 'triangle', 0.1), 180); },
    emp() { tone(1800, 0.35, 'sawtooth', 0.06, 120); },
    lure() { tone(520, 0.1, 'square', 0.05); setTimeout(() => tone(520, 0.1, 'square', 0.05), 130); },
    spotted() { tone(220, 0.25, 'square', 0.08, 440); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.1), i * 120)); },
    busted() { tone(330, 0.5, 'sawtooth', 0.1, 110); setTimeout(() => tone(220, 0.7, 'sawtooth', 0.1, 82), 300); },
    // The alarm siren rises with the meter and stops when the room calms down.
    setAlarm(level) {
      const c = ensure();
      if (!c) return;
      if (level > 0.35) {
        if (!sirenOsc) {
          sirenOsc = c.createOscillator();
          sirenGain = c.createGain();
          sirenOsc.type = 'sine';
          sirenOsc.frequency.value = 620;
          sirenGain.gain.value = 0;
          const lfo = c.createOscillator();
          const lfoGain = c.createGain();
          lfo.frequency.value = 2.2;
          lfoGain.gain.value = 180;
          lfo.connect(lfoGain).connect(sirenOsc.frequency);
          sirenOsc.connect(sirenGain).connect(c.destination);
          sirenOsc.start();
          lfo.start();
        }
        sirenGain.gain.setTargetAtTime(0.015 + level * 0.05, c.currentTime, 0.2);
      } else if (sirenOsc) {
        try { sirenOsc.stop(); } catch { /* already stopped */ }
        sirenOsc = null;
        sirenGain = null;
      }
    },
  };
}
