/* Audio.js — Shared audio handling for Key to the Gift game */

// 1) Background music (looped)
const bgm = new Audio('audio/background.mp3');
bgm.loop = true;
bgm.volume = 0.5;

// 2) Paths for SFX in the 'audio/' folder
const sfxPaths = {
  jump:         'audio/jump.mp3',
  interact:     'audio/interact.mp3',
  chestOpen:    'audio/chest_open.mp3',
  victory:      'audio/victory.mp3',      // ← new victory sound
  explosion:    'audio/explosion.mp3',     // ← new explosion sound
  evilLaugh:    'audio/evil-laugh.mp3'     // ← new evil laugh
};

// 3) Cache for instantiated Audio objects
const sfxCache = {};

// 4) Play a named sound effect (lazy-load if needed), return the Audio instance
function playSfx(name) {
  const path = sfxPaths[name];
  if (!path) return null;

  let sound = sfxCache[name];
  if (!sound) {
    sound = new Audio(path);
    sfxCache[name] = sound;
  }

  sound.currentTime = 0;
  sound.play().catch(() => {});
  return sound;
}

// 5) Initialize and persist BGM across scenes with continuous playback
const BGM_STARTED_KEY    = 'bgmStarted';
const BGM_START_TIME_KEY = 'bgmStartTime';

document.addEventListener('DOMContentLoaded', () => {
  const now            = Date.now();
  const startTimestamp = parseInt(sessionStorage.getItem(BGM_START_TIME_KEY), 10);
  const hasStarted     = sessionStorage.getItem(BGM_STARTED_KEY) === 'true';

  const startBgm = () => {
    sessionStorage.setItem(BGM_STARTED_KEY, 'true');
    sessionStorage.setItem(BGM_START_TIME_KEY, now.toString());
    bgm.currentTime = 0;
    bgm.play().catch(() => {});
  };

  if (!hasStarted) {
    if (window.location.pathname.includes('scene2.html')) {
      const onFirst = () => {
        startBgm();
        window.removeEventListener('click', onFirst);
        window.removeEventListener('keydown', onFirst);
      };
      window.addEventListener('click', onFirst);
      window.addEventListener('keydown', onFirst);
    }
  } else {
    const elapsed = (now - (isNaN(startTimestamp) ? now : startTimestamp)) / 1000;
    bgm.addEventListener('loadedmetadata', () => {
      bgm.currentTime = bgm.duration ? elapsed % bgm.duration : 0;
      bgm.play().catch(() => {});
    });
    if (bgm.readyState >= 1) {
      bgm.currentTime = bgm.duration ? elapsed % bgm.duration : 0;
      bgm.play().catch(() => {});
    }
  }
});

// 6) Expose API for game logic
window.audio = {
  playJump:         () => playSfx('jump'),
  playInteract:     () => playSfx('interact'),
  playChestOpen:    () => playSfx('chestOpen'),
  playVictory:      () => playSfx('victory'),
  playExplosion:    () => playSfx('explosion'),
  playEvilLaugh:    () => playSfx('evilLaugh'),
  stopBgm:          () => { bgm.pause(); bgm.currentTime = 0; }
};
