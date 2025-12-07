/**
 * Responsive scaling utility
 * Scales the game wrapper to fit the viewport while maintaining 1920x1200 base resolution
 */

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1200;

/**
 * Updates the scale of the wrapper element to fit the viewport
 * @param {HTMLElement} wrapper - The wrapper element to scale
 */
export function updateScale(wrapper) {
    if (!wrapper) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / BASE_WIDTH, vh / BASE_HEIGHT);

    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.left = `${(vw - BASE_WIDTH * scale) / 2}px`;
    wrapper.style.top = `${(vh - BASE_HEIGHT * scale) / 2}px`;
}

/**
 * Sets up automatic scaling on window resize
 * @param {HTMLElement} wrapper - The wrapper element to scale
 * @returns {function} Cleanup function to remove the resize listener
 */
export function setupScaling(wrapper) {
    const handler = () => updateScale(wrapper);
    window.addEventListener('resize', handler);
    handler(); // Initial scale

    return () => window.removeEventListener('resize', handler);
}

export { BASE_WIDTH, BASE_HEIGHT };
