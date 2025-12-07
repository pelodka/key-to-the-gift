/**
 * Scene 2 - Player movement and direction choice
 * Converted from scene2.html
 */

import sceneManager from '../SceneManager.js';
import GameState from '../GameState.js';
import { PLAYER_WIDTH, createPhysicsState, applyGravity, handleMovement, handleJump, updatePlayerPosition, getSpawnPosition } from '../utils/physics.js';
import { createTouchControls } from '../utils/touchControls.js';

let player, bubble, physics, keys, canMove, transitioning, animationId, gameContainer;
const LEFT_LIMIT = 0;
const RIGHT_LIMIT = 1920 - PLAYER_WIDTH;

/**
 * Initialize Scene 2
 * @param {HTMLElement} container - Game container element
 */
function init(container) {
    keys = {};
    canMove = false;
    transitioning = false;
    physics = createPhysicsState(800); // Start in center
}

/**
 * Render Scene 2 DOM
 * @param {HTMLElement} container - Game container element
 */
function render(container) {
    gameContainer = container;
    container.innerHTML = `<div id="player"></div>`;

    player = container.querySelector('#player');

    // Add initial speech bubble
    bubble = document.createElement('div');
    bubble.className = 'speech';
    bubble.style.whiteSpace = 'normal';
    bubble.textContent = 'НУ И ГДЕ МОИ ПОДАРКИ?! КУДА ТЕПЕРЬ ИДТИ - НАЛЕВО ИЛИ НАПРАВО?';
    player.appendChild(bubble);

    // Add touch controls
    createTouchControls(container, keys, { includeJump: true });

    setupEventListeners();
    updatePlayerPosition(player, physics);
    startGameLoop();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Keyboard input
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleFirstInput);
    window.addEventListener('touchstart', handleFirstInput, { passive: true });
}

/**
 * Handle first input to start movement
 */
function handleFirstInput() {
    if (!canMove && !transitioning) {
        canMove = true;
        if (bubble && bubble.parentNode) {
            bubble.remove();
        }
    }
}

/**
 * Handle key down
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;
    handleFirstInput();
}

/**
 * Handle key up
 * @param {KeyboardEvent} e
 */
function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

/**
 * Start transition to next scene
 * @param {string} side - 'left' or 'right'
 */
function startTransition(side) {
    if (transitioning) return;
    transitioning = true;
    canMove = false;

    GameState.exitSide = side;
    sceneManager.loadScene('wizard01', { exitSide: side });
}

/**
 * Main game loop
 */
function gameLoop() {
    if (canMove && !transitioning) {
        // Handle movement
        const hitBoundary = handleMovement(physics, keys, LEFT_LIMIT, RIGHT_LIMIT);
        if (hitBoundary) {
            startTransition(hitBoundary);
        }

        // Handle jump
        if (handleJump(physics, keys)) {
            window.audio.playJump();
        }
    }

    // Apply gravity
    applyGravity(physics);

    // Update DOM
    updatePlayerPosition(player, physics, 100);

    animationId = requestAnimationFrame(gameLoop);
}

/**
 * Start the game loop
 */
function startGameLoop() {
    animationId = requestAnimationFrame(gameLoop);
}

/**
 * Cleanup when leaving scene
 */
function cleanup() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('mousedown', handleFirstInput);
}

export default { init, render, cleanup };
