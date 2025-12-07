/**
 * Audio Manager - Simplified for SPA
 * No more session storage hacks needed!
 */

const BGM_FILES = {
  background: 'audio/background.mp3',
  minigame: 'audio/minigame.mp3'
};

let currentBgmType = 'background';
let bgm = null;
let bgmStarted = false;
let savedPosition = 0;

// SFX
const sfxPaths = {
  jump: 'audio/jump.mp3',
  interact: 'audio/interact.mp3',
  chestOpen: 'audio/chest_open.mp3',
  victory: 'audio/victory.mp3',
  explosion: 'audio/explosion.mp3',
  evilLaugh: 'audio/evil-laugh.mp3',
  collect: 'audio/collect.mp3'
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
  sound.play().catch(() => { });
  return sound;
}

function initBgm() {
  if (!bgm) {
    bgm = new Audio(BGM_FILES.background);
    bgm.loop = true;
    bgm.volume = 0.5;
  }
}

function startBgm() {
  initBgm();
  if (!bgmStarted) {
    bgm.currentTime = 0;
    bgm.play().catch(() => { });
    bgmStarted = true;
  }
}

function resumeBgm() {
  initBgm();
  if (bgmStarted) {
    bgm.play().catch(() => { });
  }
}

window.audio = {
  playJump: () => playSfx('jump'),
  playInteract: () => playSfx('interact'),
  playChestOpen: () => playSfx('chestOpen'),
  playVictory: () => playSfx('victory'),
  playExplosion: () => playSfx('explosion'),
  playEvilLaugh: () => playSfx('evilLaugh'),
  playCollect: () => playSfx('collect'),

  startBgm,
  resumeBgm,

  stopBgm: () => {
    if (bgm) {
      bgm.pause();
      bgm.currentTime = 0;
    }
  },

  switchBgm: function (type) {
    if (type === 'minigame' && currentBgmType !== 'minigame') {
      if (bgm) {
        savedPosition = bgm.currentTime;
        bgm.pause();
      }
      bgm = new Audio(BGM_FILES.minigame);
      bgm.loop = true;
      bgm.volume = 0.5;
      bgm.currentTime = 0;
      bgm.play().catch(() => { });
      currentBgmType = 'minigame';
    }
  },

  restoreBgm: function () {
    if (currentBgmType === 'minigame') {
      if (bgm) bgm.pause();
      bgm = new Audio(BGM_FILES.background);
      bgm.loop = true;
      bgm.volume = 0.5;
      bgm.currentTime = savedPosition;
      bgm.play().catch(() => { });
      currentBgmType = 'background';
    }
  }
};

// Auto-start BGM on first user interaction
let userInteracted = false;
function handleFirstInteraction() {
  if (!userInteracted) {
    userInteracted = true;
    // BGM starts when entering Scene2
    window.removeEventListener('keydown', handleFirstInteraction);
    window.removeEventListener('mousedown', handleFirstInteraction);
    window.removeEventListener('touchstart', handleFirstInteraction);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('keydown', handleFirstInteraction);
  window.addEventListener('mousedown', handleFirstInteraction);
  window.addEventListener('touchstart', handleFirstInteraction);
});
