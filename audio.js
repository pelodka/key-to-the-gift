/* Shared audio handling for Key to the Gift game */

// 1) Background music (looped)
const bgm = new Audio('audio/background.mp3');
bgm.loop = true;
bgm.volume = 0.5;

// 2) Paths for SFX in the 'audio/' folder
const sfxPaths = {
  jump:      'audio/jump.mp3',
  interact:  'audio/interact.mp3',
  chestOpen: 'audio/chest_open.mp3'   // updated file name for chest open sound
};

// 3) Cache for instantiated Audio objects
const sfxCache = {};

// 4) Play a named sound effect (lazy-load if needed)
function playSfx(name) {
  const path = sfxPaths[name];
  if (!path) return;

  let sound = sfxCache[name];
  if (!sound) {
    sound = new Audio(path);
    sfxCache[name] = sound;
  }

  sound.currentTime = 0;
  sound.play().catch(() => {});
}

// 5) Initialize and persist BGM across scenes
document.addEventListener('DOMContentLoaded', () => {
  const startBgm = () => {
    bgm.play().catch(() => {});
    sessionStorage.setItem('bgmStarted', 'true');
  };

  // Resume immediately if already started
  if (sessionStorage.getItem('bgmStarted') === 'true') {
    startBgm();
    return;
  }

  // Otherwise, only auto-init on scene2 after first interaction
  if (window.location.pathname.includes('scene2.html')) {
    const onFirst = () => {
      startBgm();
      window.removeEventListener('click', onFirst);
      window.removeEventListener('keydown', onFirst);
    };
    window.addEventListener('click', onFirst);
    window.addEventListener('keydown', onFirst);
  }
});

// 6) Expose API for game logic
window.audio = {
  playJump:      () => playSfx('jump'),
  playInteract:  () => playSfx('interact'),
  playChestOpen: () => playSfx('chestOpen')
};
