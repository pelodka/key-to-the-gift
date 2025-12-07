/**
 * Touch Controls Utility
 * Provides mobile-friendly virtual joystick and jump button
 */

/**
 * Detects if the current device is mobile/touch-enabled
 * @returns {boolean}
 */
export function isMobileDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Creates touch control elements (joystick + jump button) and attaches them to the container
 * @param {HTMLElement} container - Game container element
 * @param {object} keys - Keys state object to update
 * @param {object} options - Configuration options
 * @returns {HTMLElement} Touch controls element
 */
export function createTouchControls(container, keys, options = {}) {
    const { includeJump = true } = options;

    // Only show on mobile devices
    if (!isMobileDevice()) {
        return null;
    }

    const touchControls = document.createElement('div');
    touchControls.className = 'touch-controls-container';
    touchControls.innerHTML = `
        <div class="joystick-area">
            <div class="joystick-base">
                <div class="joystick-knob"></div>
            </div>
        </div>
        ${includeJump ? '<button class="jump-btn">▲</button>' : ''}
    `;

    container.appendChild(touchControls);

    const joystickBase = touchControls.querySelector('.joystick-base');
    const joystickKnob = touchControls.querySelector('.joystick-knob');
    const jumpBtn = touchControls.querySelector('.jump-btn');

    let joystickActive = false;
    let joystickStartX = 0;
    let joystickStartY = 0;
    const joystickMaxDistance = 40;

    // Joystick touch handlers
    joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystickActive = true;
        const touch = e.touches[0];
        const rect = joystickBase.getBoundingClientRect();
        joystickStartX = rect.left + rect.width / 2;
        joystickStartY = rect.top + rect.height / 2;
        updateJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        e.preventDefault();
        const touch = e.touches[0];
        updateJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (!joystickActive) return;
        joystickActive = false;
        resetJoystick();
    });

    function updateJoystick(touchX, touchY) {
        let deltaX = touchX - joystickStartX;
        let deltaY = touchY - joystickStartY;

        // Calculate distance and clamp to max
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > joystickMaxDistance) {
            deltaX = (deltaX / distance) * joystickMaxDistance;
            deltaY = (deltaY / distance) * joystickMaxDistance;
        }

        // Move knob visually
        joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        // Update key states based on joystick position
        const threshold = joystickMaxDistance * 0.3;
        keys['arrowleft'] = deltaX < -threshold;
        keys['arrowright'] = deltaX > threshold;
        // Optionally support up/down for jump:
        // keys['arrowup'] = deltaY < -threshold;
    }

    function resetJoystick() {
        joystickKnob.style.transform = 'translate(0, 0)';
        keys['arrowleft'] = false;
        keys['arrowright'] = false;
    }

    // Jump button handlers
    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys[' '] = true;
        }, { passive: false });

        jumpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[' '] = false;
        }, { passive: false });

        // Mouse support for testing on desktop
        jumpBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            keys[' '] = true;
        });

        jumpBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            keys[' '] = false;
        });

        jumpBtn.addEventListener('mouseleave', () => {
            keys[' '] = false;
        });
    }

    return touchControls;
}

/**
 * Removes touch controls from container
 * @param {HTMLElement} container - Game container element
 */
export function removeTouchControls(container) {
    const controls = container.querySelector('.touch-controls-container');
    if (controls) {
        controls.remove();
    }
}

/**
 * Makes an NPC element tappable for interaction
 * @param {HTMLElement} npcElement - The NPC/wizard element
 * @param {Function} onInteract - Callback when tapped
 * @param {Function} canInteract - Function that returns true if interaction is allowed
 */
export function makeNpcTappable(npcElement, onInteract, canInteract) {
    const imgElement = npcElement.querySelector('img');
    if (imgElement) {
        imgElement.style.pointerEvents = 'auto';
        imgElement.style.cursor = 'pointer';

        const handleTap = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (canInteract()) {
                onInteract();
            }
        };

        imgElement.addEventListener('touchstart', handleTap, { passive: false });
        imgElement.addEventListener('click', handleTap);
    }
}

/**
 * Adds touch drag-and-drop support to an element
 * @param {HTMLElement} element - Element to make draggable
 * @param {HTMLElement} container - Container for positioning
 * @param {Function} onDrop - Callback with (element, dropTarget) when dropped
 * @param {Function} getDropTargets - Function returning array of potential drop target elements
 */
export function addTouchDragDrop(element, container, onDrop, getDropTargets) {
    let isDragging = false;
    let startX, startY;
    let originalLeft, originalTop;
    let clone = null;

    element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDragging = true;
        const touch = e.touches[0];
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        startX = touch.clientX;
        startY = touch.clientY;
        originalLeft = rect.left - containerRect.left;
        originalTop = rect.top - containerRect.top;

        // Create a visual clone for dragging
        clone = element.cloneNode(true);
        clone.className = element.className + ' dragging-clone';
        clone.style.position = 'absolute';
        clone.style.left = originalLeft + 'px';
        clone.style.top = originalTop + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.zIndex = '1000';
        clone.style.opacity = '0.8';
        clone.style.pointerEvents = 'none';
        container.appendChild(clone);

        element.style.opacity = '0.3';
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging || !clone) return;
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;

        clone.style.left = (originalLeft + deltaX) + 'px';
        clone.style.top = (originalTop + deltaY) + 'px';
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (!isDragging || !clone) return;
        isDragging = false;

        // Find drop target under the clone
        const cloneRect = clone.getBoundingClientRect();
        const cloneCenterX = cloneRect.left + cloneRect.width / 2;
        const cloneCenterY = cloneRect.top + cloneRect.height / 2;

        clone.remove();
        clone = null;
        element.style.opacity = '1';

        // Check each drop target
        const dropTargets = getDropTargets();
        for (const target of dropTargets) {
            const targetRect = target.getBoundingClientRect();
            if (
                cloneCenterX >= targetRect.left &&
                cloneCenterX <= targetRect.right &&
                cloneCenterY >= targetRect.top &&
                cloneCenterY <= targetRect.bottom
            ) {
                onDrop(element, target);
                return;
            }
        }

        // No valid drop target found
        onDrop(element, null);
    });
}

/**
 * Updates the prompt text based on device type
 * @param {HTMLElement} promptElement - The prompt element
 * @param {string} desktopText - Text to show on desktop (e.g. "Press E")
 * @param {string} mobileText - Text to show on mobile (e.g. "Tap")
 */
export function setPromptText(promptElement, desktopText, mobileText) {
    if (promptElement) {
        promptElement.textContent = isMobileDevice() ? mobileText : desktopText;
    }
}
