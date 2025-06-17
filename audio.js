/* Shared audio handling for Key to the Gift game */

// Background music (looped) - only start on scene2 and beyond
const bgm = new Audio('audio/background.mp3');
bgm.loop = true;
bgm.volume = 0.5;  // adjust as needed

// Sound effect placeholders
const sfx = {
  jump:       new Audio('audio/jump.mp3'),        // player jump event
  interact:   new Audio('audio/interact.wav'),   // player interact event
  chestOpen:  new Audio('audio/chest-open.wav')  // final chest opened event
};

// Utility to reset and play a sound
function playSfx(name) {
  const sound = sfx[name];
  if (!sound) return;
  sound.currentTime = 0;
  sound.play().catch(err => {
    // console.warn(`Unable to play SFX '${name}':`, err);
  });
}

// Kick off bgm on first user interaction, but only on scene2 pages
function initBgm() {
  if (!window.location.pathname.includes('scene2.html')) return;
  const startBgm = () => {
    bgm.play().catch(() => {});
    window.removeEventListener('click', startBgm);
    window.removeEventListener('keydown', startBgm);
  };
  window.addEventListener('click', startBgm);
  window.addEventListener('keydown', startBgm);
}

// Initialize on script load
document.addEventListener('DOMContentLoaded', () => {
  initBgm();
});

// Expose API for game logic
window.audio = {
  playJump:      () => playSfx('jump'),
  playInteract:  () => playSfx('interact'),
  playChestOpen: () => playSfx('chestOpen')
};
