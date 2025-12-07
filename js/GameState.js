/**
 * Global game state management
 * Replaces URL parameters and session storage hacks
 */

const GameState = {
    // Current scene
    currentScene: 'start',

    // Exit side when transitioning (replaces ?exit=left/right URL params)
    exitSide: null,

    // Puzzle completion flags
    puzzles: {
        wizard01: false,
        wizard02: false,
        wizard03: false,
        chest: false
    },

    // Collected blocks (clues)
    collectedBlocks: {
        red: false,    // BLUTEGE from wizard01
        gold: false,   // GOLDEN from wizard02
        black: false   // SCHWARZ from wizard03
    },

    // Gift selection from start scene
    selectedGifts: new Set(),

    /**
     * Reset game to initial state
     */
    reset() {
        this.currentScene = 'start';
        this.exitSide = null;
        this.puzzles = {
            wizard01: false,
            wizard02: false,
            wizard03: false,
            chest: false
        };
        this.collectedBlocks = {
            red: false,
            gold: false,
            black: false
        };
        this.selectedGifts = new Set();
    },

    /**
     * Mark a puzzle as completed
     * @param {string} puzzleId - Puzzle identifier
     */
    completePuzzle(puzzleId) {
        if (this.puzzles.hasOwnProperty(puzzleId)) {
            this.puzzles[puzzleId] = true;
        }
    },

    /**
     * Check if a puzzle is completed
     * @param {string} puzzleId - Puzzle identifier
     * @returns {boolean}
     */
    isPuzzleComplete(puzzleId) {
        return this.puzzles[puzzleId] === true;
    },

    /**
     * Collect a block/clue
     * @param {string} color - 'red', 'gold', or 'black'
     */
    collectBlock(color) {
        if (this.collectedBlocks.hasOwnProperty(color)) {
            this.collectedBlocks[color] = true;
        }
    },

    /**
     * Check if all blocks are collected
     * @returns {boolean}
     */
    hasAllBlocks() {
        return Object.values(this.collectedBlocks).every(v => v);
    }
};

export default GameState;
