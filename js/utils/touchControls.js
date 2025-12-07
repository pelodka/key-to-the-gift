/**
 * Touch Controls Utility
 * Provides mobile-friendly touch buttons for movement
 */

/**
 * Creates touch control buttons and attaches them to the container
 * @param {HTMLElement} container - Game container element
 * @param {object} keys - Keys state object to update
 * @param {object} options - Configuration options
 * @returns {HTMLElement} Touch controls element
 */
export function createTouchControls(container, keys, options = {}) {
    const { includeInteract = false, includeJump = true } = options;

    const touchControls = document.createElement('div');
    touchControls.className = 'touch-controls';
    touchControls.innerHTML = `
    <button id="btn-left" class="touch-btn">◀</button>
    ${includeJump ? '<button id="btn-jump" class="touch-btn">▲</button>' : ''}
    <button id="btn-right" class="touch-btn">▶</button>
    ${includeInteract ? '<button id="btn-interact" class="touch-btn">E</button>' : ''}
  `;

    container.appendChild(touchControls);

    // Touch mappings
    const mappings = [
        ['btn-left', 'arrowleft'],
        ['btn-right', 'arrowright']
    ];

    if (includeJump) {
        mappings.push(['btn-jump', ' ']);
    }

    if (includeInteract) {
        mappings.push(['btn-interact', 'e']);
    }

    mappings.forEach(([id, key]) => {
        const btn = touchControls.querySelector(`#${id}`);
        if (btn) {
            btn.addEventListener('touchstart', e => {
                e.preventDefault();
                keys[key] = true;
            }, { passive: false });

            btn.addEventListener('touchend', e => {
                e.preventDefault();
                keys[key] = false;
            }, { passive: false });

            // Also handle mouse for testing on desktop
            btn.addEventListener('mousedown', e => {
                e.preventDefault();
                keys[key] = true;
            });

            btn.addEventListener('mouseup', e => {
                e.preventDefault();
                keys[key] = false;
            });

            btn.addEventListener('mouseleave', () => {
                keys[key] = false;
            });
        }
    });

    return touchControls;
}

/**
 * Removes touch controls from container
 * @param {HTMLElement} container - Game container element
 */
export function removeTouchControls(container) {
    const controls = container.querySelector('.touch-controls');
    if (controls) {
        controls.remove();
    }
}
