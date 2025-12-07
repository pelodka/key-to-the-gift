/**
 * Scene Manager - Controls scene transitions and lifecycle
 */

import GameState from './GameState.js';
import { setupScaling } from './utils/scaling.js';

class SceneManager {
    constructor() {
        this.scenes = {};
        this.currentScene = null;
        this.container = null;
        this.wrapper = null;
        this.cleanupScaling = null;
        this.transitionDuration = 600; // ms
    }

    /**
     * Initialize the scene manager
     * @param {HTMLElement} container - The app container element
     */
    init(container) {
        this.container = container;
        this.createWrapper();
    }

    /**
     * Creates the game wrapper structure
     */
    createWrapper() {
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'wrapper';

        const gameContainer = document.createElement('div');
        gameContainer.id = 'game-container';

        this.wrapper.appendChild(gameContainer);
        this.container.appendChild(this.wrapper);

        // Setup responsive scaling
        this.cleanupScaling = setupScaling(this.wrapper);
    }

    /**
     * Register a scene
     * @param {string} name - Scene identifier
     * @param {object} scene - Scene module with init, render, cleanup methods
     */
    register(name, scene) {
        this.scenes[name] = scene;
    }

    /**
     * Load and display a scene
     * @param {string} name - Scene name to load
     * @param {object} params - Optional parameters to pass to the scene
     */
    async loadScene(name, params = {}) {
        const scene = this.scenes[name];
        if (!scene) {
            console.error(`Scene '${name}' not found`);
            return;
        }

        const gameContainer = this.wrapper.querySelector('#game-container');

        // Cleanup current scene
        if (this.currentScene && this.currentScene.cleanup) {
            this.currentScene.cleanup();
        }

        // Transition out
        if (this.currentScene) {
            await this.transitionOut();
        }

        // Clear container
        gameContainer.innerHTML = '';

        // Update global state
        GameState.currentScene = name;
        if (params.exitSide) {
            GameState.exitSide = params.exitSide;
        }

        // Initialize new scene
        this.currentScene = scene;
        if (scene.init) {
            scene.init(gameContainer, params);
        }
        if (scene.render) {
            scene.render(gameContainer);
        }

        // Transition in
        await this.transitionIn();
    }

    /**
     * Pixelated zoom-out transition
     */
    transitionOut() {
        return new Promise(resolve => {
            this.wrapper.classList.add('transition-out');
            setTimeout(() => {
                this.wrapper.classList.remove('transition-out');
                resolve();
            }, this.transitionDuration);
        });
    }

    /**
     * Fade-in transition
     */
    transitionIn() {
        return new Promise(resolve => {
            this.wrapper.classList.add('transition-in');
            setTimeout(() => {
                this.wrapper.classList.remove('transition-in');
                resolve();
            }, 300);
        });
    }

    /**
     * Get the game container element
     * @returns {HTMLElement}
     */
    getGameContainer() {
        return this.wrapper?.querySelector('#game-container');
    }

    /**
     * Cleanup the scene manager
     */
    destroy() {
        if (this.cleanupScaling) {
            this.cleanupScaling();
        }
        if (this.currentScene && this.currentScene.cleanup) {
            this.currentScene.cleanup();
        }
    }
}

// Singleton instance
const sceneManager = new SceneManager();
export default sceneManager;
