/**
 * Shared physics and movement utilities
 */

import { BASE_WIDTH } from './scaling.js';

const PLAYER_WIDTH = 320;
const GRAVITY = 0.8;
const MOVE_SPEED = 4;
const JUMP_SPEED = 15;

/**
 * Creates a physics state object for a player
 * @param {number} startX - Initial X position
 * @returns {object} Physics state
 */
export function createPhysicsState(startX = 0) {
    return {
        posX: startX,
        posY: 0,
        isJumping: false,
        jumpSpeed: 0,
        flipped: false
    };
}

/**
 * Applies gravity to the physics state
 * @param {object} state - Physics state object
 */
export function applyGravity(state) {
    if (state.isJumping) {
        state.posY += state.jumpSpeed;
        state.jumpSpeed -= GRAVITY;
        if (state.posY <= 0) {
            state.posY = 0;
            state.isJumping = false;
        }
    }
}

/**
 * Handles horizontal movement
 * @param {object} state - Physics state object
 * @param {object} keys - Key press state
 * @param {number} leftLimit - Left boundary
 * @param {number} rightLimit - Right boundary
 * @param {number} speed - Movement speed multiplier (default 1)
 * @returns {string|null} 'left' or 'right' if hit boundary, null otherwise
 */
export function handleMovement(state, keys, leftLimit, rightLimit, speed = 1) {
    const moveSpeed = MOVE_SPEED * speed;
    let hitBoundary = null;

    if (keys['arrowleft'] || keys['a']) {
        state.posX = Math.max(leftLimit, state.posX - moveSpeed);
        state.flipped = true;
        if (state.posX === leftLimit) hitBoundary = 'left';
    }

    if (keys['arrowright'] || keys['d']) {
        state.posX = Math.min(rightLimit, state.posX + moveSpeed);
        state.flipped = false;
        if (state.posX === rightLimit) hitBoundary = 'right';
    }

    return hitBoundary;
}

/**
 * Handles jump initiation
 * @param {object} state - Physics state object
 * @param {object} keys - Key press state
 * @returns {boolean} True if jump was initiated
 */
export function handleJump(state, keys) {
    if ((keys[' '] || keys['arrowup'] || keys['w']) && !state.isJumping) {
        state.isJumping = true;
        state.jumpSpeed = JUMP_SPEED;
        return true;
    }
    return false;
}

/**
 * Updates player DOM element position
 * @param {HTMLElement} player - Player element
 * @param {object} state - Physics state
 * @param {number} baseBottom - Base bottom position (default 80)
 */
export function updatePlayerPosition(player, state, baseBottom = 80) {
    player.style.left = state.posX + 'px';
    player.style.bottom = (baseBottom + state.posY) + 'px';
    player.classList.toggle('flipped', state.flipped);
}

/**
 * Calculates spawn position based on exit side
 * @param {string} exitSide - 'left' or 'right'
 * @param {number} gameWidth - Width of game area
 * @returns {number} Spawn X position
 */
export function getSpawnPosition(exitSide, gameWidth) {
    const rightLimit = gameWidth - PLAYER_WIDTH;
    // If exited left, spawn on right; if exited right, spawn on left
    return exitSide === 'left' ? rightLimit : 0;
}

export { PLAYER_WIDTH, GRAVITY, MOVE_SPEED, JUMP_SPEED };
