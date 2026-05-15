// ── Premium UI Sounds ────────────────────────────────────────────────────────
// Using subtle, high-quality audio samples for micro-interactions

const SOUND_URLS = {
  click:   'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  badge:   'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  error:   'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
};

// Pre-create audio objects to improve latency and handle loading
const audioCache = {};
Object.entries(SOUND_URLS).forEach(([key, url]) => {
  try {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audioCache[key] = audio;
  } catch (e) {
    console.error(`Failed to pre-load sound: ${key}`, e);
  }
});

const triggerHaptic = (type) => {
  if (!window.navigator || !window.navigator.vibrate) return;

  switch (type) {
    case 'click':
      window.navigator.vibrate(15);
      break;
    case 'success':
      window.navigator.vibrate(30);
      break;
    case 'badge':
      window.navigator.vibrate([40, 20, 40]);
      break;
    case 'error':
      window.navigator.vibrate([50, 100, 50]);
      break;
    default:
      break;
  }
};

const playSound = (type, volume = 0.5) => {
  try {
    // Trigger haptic feedback for mobile
    triggerHaptic(type);

    const audio = audioCache[type];
    if (!audio) {
      console.warn(`Sound type "${type}" not found in cache.`);
      return;
    }

    // Reset and play
    audio.currentTime = 0;
    audio.volume = volume;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Sound play failed. Browsers usually require a user interaction first.', err);
      });
    }
  } catch (err) {
    console.error('Audio utility error:', err);
  }
};

export default playSound;
