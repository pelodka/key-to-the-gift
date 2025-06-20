const BGM_FILES = {
  background: 'audio/background.mp3',
  minigame:   'audio/minigame.mp3'
};
const BGM_STARTED_KEY    = 'bgmStarted';
const BGM_START_TIME_KEY = 'bgmStartTime';
let currentBgmType = 'background';

let bgm = new Audio(BGM_FILES.background);
bgm.loop = true;
bgm.volume = 0.5;

// SFX
const sfxPaths = {
  jump:         'audio/jump.mp3',
  interact:     'audio/interact.mp3',
  chestOpen:    'audio/chest_open.mp3',
  victory:      'audio/victory.mp3',
  explosion:    'audio/explosion.mp3',
  evilLaugh:    'audio/evil-laugh.mp3',
  collect:      'audio/collect.mp3'
};
const sfxCache = {};
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

window.audio = {
  playJump:         () => playSfx('jump'),
  playInteract:     () => playSfx('interact'),
  playChestOpen:    () => playSfx('chestOpen'),
  playVictory:      () => playSfx('victory'),
  playExplosion:    () => playSfx('explosion'),
  playEvilLaugh:    () => playSfx('evilLaugh'),
  playCollect:      () => playSfx('collect'),
  stopBgm:          () => { bgm.pause(); bgm.currentTime = 0; },
  switchBgm: function(type) {
    if (type === 'minigame' && currentBgmType !== 'minigame') {
      try { window.sessionStorage.setItem('bgmLastPosition', bgm.currentTime); } catch(e) {}
      bgm.pause();
      bgm = new Audio(BGM_FILES.minigame);
      bgm.loop = true;
      bgm.volume = 0.5;
      bgm.currentTime = 0;
      bgm.play().catch(() => {});
      currentBgmType = 'minigame';
    }
  },
  restoreBgm: function() {
    if (currentBgmType === 'minigame') {
      bgm.pause();
      bgm = new Audio(BGM_FILES.background);
      bgm.loop = true;
      bgm.volume = 0.5;
      try {
        const resume = parseFloat(window.sessionStorage.getItem('bgmLastPosition')) || 0;
        bgm.addEventListener('loadedmetadata', () => {
          bgm.currentTime = resume;
          bgm.play().catch(() => {});
        });
        if (bgm.readyState >= 1) {
          bgm.currentTime = resume;
          bgm.play().catch(() => {});
        }
      } catch(e) { bgm.play().catch(() => {}); }
      currentBgmType = 'background';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  let bgmResumeHandler;
  const alreadyStarted = sessionStorage.getItem(BGM_STARTED_KEY) === 'true';
  const now            = Date.now();
  const startTimestamp = parseInt(sessionStorage.getItem(BGM_START_TIME_KEY), 10);
  let resumeTime = 0;

  // Only allow music to start from scene2.html after user action!
  function isStartScene() {
    // Adjust if your URL/path changes!
    return window.location.pathname.includes('scene2.html');
  }

  if (alreadyStarted && !isNaN(startTimestamp)) {
    let elapsed = (now - startTimestamp) / 1000;
    resumeTime = elapsed;
  }

  function startOrResumeBgm() {
    if (!alreadyStarted && isStartScene()) {
      // Only start in scene2.html!
      sessionStorage.setItem(BGM_STARTED_KEY, 'true');
      sessionStorage.setItem(BGM_START_TIME_KEY, Date.now().toString());
      bgm.currentTime = 0;
      bgm.play().catch(()=>{});
    } else if (alreadyStarted) {
      bgm.currentTime = bgm.duration ? resumeTime % bgm.duration : 0;
      bgm.play().catch(()=>{});
    }
    // Remove listeners
    window.removeEventListener('keydown', bgmResumeHandler);
    window.removeEventListener('mousedown', bgmResumeHandler);
    window.removeEventListener('touchstart', bgmResumeHandler);
  }

  bgmResumeHandler = startOrResumeBgm;
  if (isStartScene() || alreadyStarted) {
    window.addEventListener('keydown', bgmResumeHandler);
    window.addEventListener('mousedown', bgmResumeHandler);
    window.addEventListener('touchstart', bgmResumeHandler);
  }
});
