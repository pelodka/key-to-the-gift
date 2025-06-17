/* Shared audio handling for Key to the Gift game */

// Background music (looped)
const bgm = new Audio('audio/background.mp3');
bgm.loop = true;
bgm.volume = 0.5;  // adjust as needed

// Sound effect placeholders
const sfx = {
  jump:       new Audio('audio/jump.mp3'),        // player jump event
  interact:   new Audio('audio/interact.mp3'),   // player interact event
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

// Initialize and persist BGM across scenes
document.addEventListener('DOMContentLoaded', () => {
  const startBgm = () => {
    bgm.play().catch(() => {});
    sessionStorage.setItem('bgmStarted', 'true');
  };

  // If already started in this session, resume immediately
  if (sessionStorage.getItem('bgmStarted') === 'true') {
    startBgm();
    return;
  }

  // Otherwise, only auto-init on scene2 after first interaction
  if (window.location.pathname.includes('scene2.html')) {
    const onFirstInteraction = () => {
      startBgm();
      window.removeEventListener('click', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
    window.addEventListener('click', onFirstInteraction);
    window.addEventListener('keydown', onFirstInteraction);
  }
});

// Expose API for game logic
window.audio = {
  playJump:      () => playSfx('jump'),
  playInteract:  () => playSfx('interact'),
  playChestOpen: () => playSfx('chestOpen')
};
