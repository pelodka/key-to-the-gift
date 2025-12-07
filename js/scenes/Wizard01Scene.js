/**
 * Wizard 01 Scene - Note collection minigame
 * Converted from wizard01.html
 */

import sceneManager from '../SceneManager.js';
import GameState from '../GameState.js';
import { PLAYER_WIDTH, createPhysicsState, applyGravity, handleMovement, handleJump, updatePlayerPosition, getSpawnPosition } from '../utils/physics.js';
import { createTouchControls } from '../utils/touchControls.js';

let player, gameContainer, prompt, overlay, dialogText, choicesDiv, minigameUI, minigameScore;
let physics, keys, inDialog, interactionFinished, waitingBlock, puzzleSolved, minigameActive, animationId;
let interactPressed = false;
const LEFT_LIMIT = 0;
let RIGHT_LIMIT;

const GREETING = 'Привет, Саша! Представляешь, в голове вертится песня! Но не могу ноты ПОДОБРАТЬ, поможешь?';
const CORRECT_TIP = 'Ну точно! Спасибо! Кстати, я должен дать тебе подсказку - это <span style="color:red;font-weight:bold;">BLUTEGE</span>.';

function init(container, params) {
    const exitSide = params?.exitSide || GameState.exitSide;
    const gameWidth = container.clientWidth || 1920;
    RIGHT_LIMIT = gameWidth - PLAYER_WIDTH;

    const spawnX = getSpawnPosition(exitSide, gameWidth);
    physics = createPhysicsState(spawnX);
    keys = {};
    inDialog = false;
    interactionFinished = GameState.isPuzzleComplete('wizard01');
    waitingBlock = false;
    puzzleSolved = GameState.isPuzzleComplete('wizard01');
    minigameActive = false;
}

function render(container) {
    gameContainer = container;
    container.innerHTML = `
    <div id="player"></div>
    <div class="wizard" id="wizard">
      <img id="wizard-img" src="wizard1.png" alt="Wizard" />
      <div id="prompt" class="prompt">Press E</div>
    </div>
    <div class="dialog-overlay" id="dialog-overlay">
      <div class="dialog-box">
        <p id="dialog-text" class="dialog-text"></p>
        <div id="choices"></div>
      </div>
    </div>
    <div id="minigame-ui" class="minigame-ui"></div>
    <div id="minigame-score" class="minigame-score"></div>
  `;

    player = container.querySelector('#player');
    prompt = container.querySelector('#prompt');
    overlay = container.querySelector('#dialog-overlay');
    dialogText = container.querySelector('#dialog-text');
    choicesDiv = container.querySelector('#choices');
    minigameUI = container.querySelector('#minigame-ui');
    minigameScore = container.querySelector('#minigame-score');

    // Add touch controls with interact button
    createTouchControls(container, keys, { includeJump: true, includeInteract: true });

    setupEventListeners();
    updatePlayerPosition(player, physics);
    startGameLoop();
}

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === 'e' && prompt.style.display === 'block' && !minigameActive) {
        window.audio.playInteract();
        if (!interactionFinished) {
            startDialog();
        } else if (!waitingBlock) {
            overlay.style.display = 'block';
            dialogText.textContent = 'ЙЕЕЕ РОЦК! Можешь идти дальше!';
            choicesDiv.innerHTML = '';
            setTimeout(() => overlay.style.display = 'none', 2000);
        }
    }

    if (puzzleSolved) {
        if ((key === 'arrowleft' || key === 'a') && physics.posX <= LEFT_LIMIT) {
            sceneManager.loadScene('wizard02', { exitSide: 'left' });
        }
        if ((key === 'arrowright' || key === 'd') && physics.posX >= RIGHT_LIMIT) {
            sceneManager.loadScene('wizard02', { exitSide: 'right' });
        }
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

function startDialog() {
    inDialog = true;
    overlay.style.display = 'block';
    dialogText.textContent = GREETING;
    choicesDiv.innerHTML = '';

    const proceed = () => {
        cleanup_listeners();
        overlay.style.display = 'none';
        inDialog = false;
        startMiniGame();
    };

    const cleanup_listeners = () => {
        window.removeEventListener('keydown', proceed);
        window.removeEventListener('mousedown', proceed);
    };

    setTimeout(() => {
        window.addEventListener('keydown', proceed);
        window.addEventListener('mousedown', proceed);
    }, 0);
}

function startMiniGame() {
    minigameActive = true;
    prompt.style.display = 'none';

    minigameUI.style.display = 'block';
    minigameUI.innerHTML = 'ПОДБЕРИ 7 нот 🎵';
    minigameScore.style.display = 'block';
    minigameScore.textContent = '0 / 7';

    window.audio?.switchBgm?.('minigame');

    player.classList.add('collecting');

    let notesCollected = 0, totalNotes = 7, gameActive = true;
    const activeNotes = [];

    function spawnNote() {
        if (!gameActive) return;

        const note = document.createElement('div');
        note.className = 'note';
        note.innerText = '🎵';
        let nx = Math.floor(Math.random() * (gameContainer.clientWidth - 60));
        note.style.left = nx + 'px';
        note.style.top = '0px';
        gameContainer.appendChild(note);
        activeNotes.push(note);

        let noteY = 0, speed = 4 + Math.random() * 3, caught = false;

        function fall() {
            if (!gameActive) { note.remove(); return; }
            noteY += speed;
            note.style.top = noteY + 'px';

            const playerRect = player.getBoundingClientRect();
            const noteRect = note.getBoundingClientRect();
            const overlapX = (noteRect.left < playerRect.right && noteRect.right > playerRect.left);
            const overlapY = (noteRect.bottom > playerRect.top + 60 && noteRect.top < playerRect.bottom);

            if (!caught && overlapX && overlapY) {
                caught = true;
                window.audio?.playCollect?.();
                note.style.filter = 'brightness(2) drop-shadow(0 0 10px #ff0)';
                setTimeout(() => note.remove(), 100);
                notesCollected++;
                minigameScore.textContent = `${notesCollected} / ${totalNotes}`;
                minigameUI.innerHTML = `ПОДОБРАНО: ${notesCollected} / ${totalNotes} нот 🎵`;

                if (notesCollected >= totalNotes) {
                    gameActive = false;
                    setTimeout(minigameComplete, 350);
                    minigameUI.innerHTML = 'Готово!';
                }
                return;
            }

            if (noteY > gameContainer.clientHeight - 30 && !caught) {
                note.remove();
                if (gameActive) setTimeout(spawnNote, 350);
                return;
            }

            if (!caught && gameActive) requestAnimationFrame(fall);
        }
        requestAnimationFrame(fall);
    }

    let notesStarted = 0;
    function spawnNotesInterval() {
        if (!gameActive) return;
        spawnNote();
        notesStarted++;
        if (notesStarted < totalNotes) setTimeout(spawnNotesInterval, 700 + Math.random() * 800);
    }
    spawnNotesInterval();

    function minigameLoop() {
        if (!gameActive) return;
        handleMovement(physics, keys, LEFT_LIMIT, RIGHT_LIMIT, 1.5);
        updatePlayerPosition(player, physics);
        requestAnimationFrame(minigameLoop);
    }
    minigameLoop();

    function minigameComplete() {
        minigameActive = false;
        activeNotes.forEach(n => n.remove());
        minigameUI.style.display = 'none';
        minigameScore.style.display = 'none';
        player.classList.remove('collecting');
        window.audio?.restoreBgm?.();
        showBLUTEGETip();
    }
}

function showBLUTEGETip() {
    inDialog = true;
    overlay.style.display = 'block';
    dialogText.innerHTML = CORRECT_TIP;
    choicesDiv.innerHTML = '';

    const onInput = () => {
        cleanup_handlers();
        overlay.style.display = 'none';
        inDialog = false;
        interactionFinished = true;
        setupCollectible();
    };

    const cleanup_handlers = () => {
        window.removeEventListener('keydown', onInput);
        window.removeEventListener('mousedown', onInput);
    };

    window.addEventListener('keydown', onInput);
    window.addEventListener('mousedown', onInput);
}

function setupCollectible() {
    waitingBlock = true;
    player.classList.add('hands-up');

    const block = document.createElement('div');
    block.className = 'collect-block';
    block.style.background = 'red';
    block.style.left = (physics.posX + (PLAYER_WIDTH - 60) / 2) + 'px';
    block.style.bottom = (80 + physics.posY + PLAYER_WIDTH + 10) + 'px';
    gameContainer.appendChild(block);

    block.addEventListener('click', () => {
        block.style.transition = 'all 0.5s ease-out';
        block.style.left = '0px';
        block.style.bottom = (gameContainer.clientHeight - 40) + 'px';

        block.addEventListener('transitionend', () => {
            block.remove();
            waitingBlock = false;
            interactionFinished = true;
            puzzleSolved = true;
            GameState.completePuzzle('wizard01');
            GameState.collectBlock('red');
            player.classList.remove('hands-up');
        }, { once: true });
    });
}

function checkProximity() {
    const wizardX = (gameContainer.clientWidth - PLAYER_WIDTH) / 2;
    if (minigameActive) {
        prompt.style.display = 'none';
    } else {
        prompt.style.display = (!inDialog && !waitingBlock && Math.abs(physics.posX - wizardX) < PLAYER_WIDTH * 0.6) ? 'block' : 'none';
    }
}

function gameLoop() {
    // Handle touch E button interaction
    if (keys['e'] && !interactPressed && prompt.style.display === 'block' && !minigameActive) {
        interactPressed = true;
        window.audio.playInteract();
        if (!interactionFinished) {
            startDialog();
        } else if (!waitingBlock) {
            overlay.style.display = 'block';
            dialogText.textContent = 'ЙЕЕЕ РОЦК! Можешь идти дальше!';
            choicesDiv.innerHTML = '';
            setTimeout(() => overlay.style.display = 'none', 2000);
        }
    }
    if (!keys['e']) {
        interactPressed = false;
    }

    if (!inDialog && !waitingBlock && !minigameActive) {
        handleMovement(physics, keys, LEFT_LIMIT, RIGHT_LIMIT);
        if (handleJump(physics, keys)) {
            window.audio.playJump();
        }
    }

    applyGravity(physics);
    updatePlayerPosition(player, physics);
    checkProximity();

    // Handle scene transitions for mobile touch controls
    if (puzzleSolved) {
        if ((keys['arrowleft'] || keys['a']) && physics.posX <= LEFT_LIMIT) {
            sceneManager.loadScene('wizard02', { exitSide: 'left' });
        }
        if ((keys['arrowright'] || keys['d']) && physics.posX >= RIGHT_LIMIT) {
            sceneManager.loadScene('wizard02', { exitSide: 'right' });
        }
    }

    animationId = requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    animationId = requestAnimationFrame(gameLoop);
}

function cleanup() {
    if (animationId) cancelAnimationFrame(animationId);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
}

export default { init, render, cleanup };
