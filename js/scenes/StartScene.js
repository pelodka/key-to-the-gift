/**
 * Start Scene - Gift selection and dragon sequence
 * Converted from index.html
 */

import sceneManager from '../SceneManager.js';
import GameState from '../GameState.js';

let goBtn, startScreen, loadingScreen, giftSection, gift1, gift2, getBtn, gameContainer, dragonBundle, dragon;

/**
 * Initialize the start scene
 * @param {HTMLElement} container - Game container element
 */
function init(container) {
    // Reset game state for new game
    GameState.reset();
}

/**
 * Render the start scene DOM
 * @param {HTMLElement} container - Game container element
 */
function render(container) {
    container.innerHTML = `
    <div id="start-screen" class="centered">
      <button id="go-btn" class="game-btn">ПОГНАЛИ</button>
    </div>
    <div id="loading-screen" class="centered" style="display:none">
      <p class="loading-text">СОБИРАЕМ ПОДАРКИ...</p>
    </div>
    <div id="gift-section" class="centered gift-section">
      <div id="gift-cards" class="gift-cards">
        <img id="gift1" class="gift-card" src="gift_card_1.png" alt="Gift 1">
        <img id="gift2" class="gift-card" src="gift_card_2.png" alt="Gift 2">
      </div>
      <button id="get-presents" class="action-btn"></button>
    </div>
    <div id="dragon-bundle" class="dragon-bundle">
      <div id="dragon" class="dragon"></div>
    </div>
  `;

    // Get DOM references
    goBtn = container.querySelector('#go-btn');
    startScreen = container.querySelector('#start-screen');
    loadingScreen = container.querySelector('#loading-screen');
    giftSection = container.querySelector('#gift-section');
    gift1 = container.querySelector('#gift1');
    gift2 = container.querySelector('#gift2');
    getBtn = container.querySelector('#get-presents');
    gameContainer = container;
    dragonBundle = container.querySelector('#dragon-bundle');
    dragon = container.querySelector('#dragon');

    setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // GO button -> loading -> gifts
    goBtn.addEventListener('click', handleGoClick);

    // Gift selection
    gift1.addEventListener('click', () => toggleGift(gift1));
    gift2.addEventListener('click', () => toggleGift(gift2));

    // Get presents button
    getBtn.addEventListener('click', handleGetPresents);

    // Touch support
    [goBtn, gift1, gift2, getBtn].forEach(btn => {
        btn.addEventListener('touchstart', e => {
            e.preventDefault();
            btn.click();
        }, { passive: false });
    });
}

/**
 * Handle GO button click
 */
function handleGoClick() {
    startScreen.style.display = 'none';
    loadingScreen.style.display = 'block';

    setTimeout(() => {
        loadingScreen.style.display = 'none';
        giftSection.style.display = 'block';
    }, 2000);
}

/**
 * Toggle gift card selection
 * @param {HTMLElement} img - Gift card image element
 */
function toggleGift(img) {
    const giftId = img.id;

    if (GameState.selectedGifts.has(giftId)) {
        GameState.selectedGifts.delete(giftId);
        img.classList.remove('selected');
    } else {
        GameState.selectedGifts.add(giftId);
        img.classList.add('selected');
    }

    getBtn.classList.toggle('enabled', GameState.selectedGifts.size === 2);
}

/**
 * Handle Get Presents button - Dragon sequence
 */
function handleGetPresents() {
    if (!getBtn.classList.contains('enabled')) return;

    gameContainer.classList.add('shake');
    window.audio.playExplosion();

    setTimeout(() => {
        dragonBundle.style.display = 'block';
        dragonBundle.style.left = '30%';
        dragonBundle.style.top = '20%';

        setTimeout(() => {
            dragonBundle.style.left = '50%';
            dragonBundle.style.top = '30%';
            dragonBundle.style.transform = 'translate(-50%, -50%) scale(3)';

            setTimeout(() => {
                // Add speech bubble
                const bubble = document.createElement('div');
                bubble.className = 'speech';
                bubble.textContent = 'ХА-ХА!';
                window.audio.playEvilLaugh();
                dragon.appendChild(bubble);

                // Attach gifts to dragon
                [gift1, gift2].forEach((g, i) => {
                    g.style.position = 'absolute';
                    g.style.top = '70px';
                    g.style.left = i ? '120px' : '-60px';
                    dragonBundle.appendChild(g);
                });

                setTimeout(() => {
                    dragonBundle.style.left = '120%';
                    dragonBundle.style.top = '10%';

                    setTimeout(() => {
                        // Transition to Scene 2
                        sceneManager.loadScene('scene2');
                    }, 1000);
                }, 1500);
            }, 1000);
        }, 1000);
    }, 500);
}

/**
 * Cleanup when leaving scene
 */
function cleanup() {
    // Remove event listeners if needed
}

export default { init, render, cleanup };
