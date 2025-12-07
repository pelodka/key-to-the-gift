/**
 * Chest Scene - Final puzzle and victory
 * Converted from chest.html
 */

import sceneManager from '../SceneManager.js';
import GameState from '../GameState.js';
import { PLAYER_WIDTH, createPhysicsState, applyGravity, handleMovement, handleJump, updatePlayerPosition, getSpawnPosition } from '../utils/physics.js';
import { createTouchControls } from '../utils/touchControls.js';

let player, gameContainer, prompt, overlay, dialogText, boxContainer, openBtn, feedback, wizardImg;
let physics, keys, isJumping, jumpSpeed, puzzleSolved, inDialog, dragData, animationId;
const LEFT_LIMIT = 0;
let RIGHT_LIMIT;

const colors = ['black', 'red', 'gold'];
const words = { black: 'SWARTZ', red: 'BLUTEGE', gold: 'GOLDENE' };
const correctOrder = ['black', 'red', 'gold'];
const GREETING = 'А вот и последняя загадка! Подарки уже совсем рядом!';

const confettiColors = [
    '#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93',
    '#fdffb6', '#b5ead7', '#f9c74f', '#f94144', '#43aa8b'
];
let confettiActive = false;

function init(container, params) {
    const exitSide = params?.exitSide || GameState.exitSide;
    const gameWidth = container.clientWidth || 1920;
    RIGHT_LIMIT = gameWidth - PLAYER_WIDTH;

    const spawnX = getSpawnPosition(exitSide, gameWidth);
    physics = createPhysicsState(spawnX);
    keys = {};
    isJumping = false;
    jumpSpeed = 0;
    puzzleSolved = false;
    inDialog = false;
    dragData = null;
}

function render(container) {
    gameContainer = container;
    container.innerHTML = `
    <div id="player"></div>
    <div class="wizard" id="wizard" style="width: 320px; height: 320px;">
      <img id="wizard-img" src="chest_closed.png" alt="Chest" />
      <div id="prompt" class="prompt">Press E</div>
    </div>
    <div class="dialog-overlay" id="dialog-overlay">
      <div class="dialog-box" style="width: 800px;">
        <div id="box-container" class="box-container"></div>
        <p id="dialog-text" class="dialog-text"></p>
        <button id="open-btn" class="open-btn">ОТКРЫТЬ</button>
        <div id="feedback" class="feedback"></div>
      </div>
    </div>
  `;

    player = container.querySelector('#player');
    prompt = container.querySelector('#prompt');
    overlay = container.querySelector('#dialog-overlay');
    dialogText = container.querySelector('#dialog-text');
    boxContainer = container.querySelector('#box-container');
    openBtn = container.querySelector('#open-btn');
    feedback = container.querySelector('#feedback');
    wizardImg = container.querySelector('#wizard-img');

    player.style.left = physics.posX + 'px';
    player.style.bottom = '80px';

    // Add touch controls with interact button
    createTouchControls(container, keys, { includeJump: true, includeInteract: true });

    setupEventListeners();
    startGameLoop();
}

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    openBtn.addEventListener('click', handleOpen);
}

function handleKeyDown(e) {
    if (puzzleSolved) return;
    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'e' && prompt.style.display === 'block' && !inDialog) {
        window.audio.playInteract();
        startDialog();
    }
}

function handleKeyUp(e) {
    if (puzzleSolved) return;
    const key = e.key.toLowerCase();
    if (key === 'e') window.audio.playInteract();
    keys[key] = false;
}

function startDialog() {
    if (puzzleSolved) return;
    inDialog = true;
    overlay.style.display = 'block';
    dialogText.textContent = GREETING;
    boxContainer.innerHTML = '';
    openBtn.style.display = 'none';
    feedback.textContent = '';

    function proceed() {
        overlay.removeEventListener('click', proceed);
        document.removeEventListener('keydown', proceed);
        dialogText.innerHTML = 'Aus der <span class="drop-target" data-index="0"></span> der Knechtschaft durch <span class="drop-target" data-index="1"></span> Schlachten ans <span class="drop-target" data-index="2"></span> Licht der Freiheit.';
        setupPuzzle();
    }

    overlay.addEventListener('click', proceed, { once: true });
    document.addEventListener('keydown', proceed, { once: true });
}

function createBox(color) {
    const box = document.createElement('div');
    box.className = 'draggable-box';
    box.draggable = true;
    box.dataset.color = color;
    box.style.background = color;
    box.addEventListener('dragstart', () => {
        feedback.textContent = '';
        dragData = { color, from: 'box' };
    });
    return box;
}

function setupPuzzle() {
    boxContainer.innerHTML = '';
    colors.forEach(c => boxContainer.appendChild(createBox(c)));
    openBtn.style.display = 'none';

    document.querySelectorAll('.drop-target').forEach(target => {
        target.draggable = true;
        target.style.display = 'inline-block';
        target.style.width = '120px';
        target.style.borderBottom = '2px solid #333';
        target.style.margin = '0 5px';
        target.style.minHeight = '36px';
        target.style.cursor = 'pointer';
        target.style.verticalAlign = 'middle';

        target.addEventListener('dragstart', e => {
            if (!target.dataset.filled) { e.preventDefault(); return; }
            feedback.textContent = '';
            const color = target.dataset.filled;
            dragData = { color, from: 'target' };
            const img = document.createElement('div');
            img.style.cssText = `width:60px;height:40px;background:${color};position:absolute;top:-1000px;`;
            document.body.appendChild(img);
            e.dataTransfer.setDragImage(img, 30, 20);
            setTimeout(() => document.body.removeChild(img), 0);
            target.textContent = '';
            delete target.dataset.filled;
        });

        target.addEventListener('dragover', e => e.preventDefault());

        target.addEventListener('drop', e => {
            e.preventDefault();
            const prev = target.dataset.filled;
            if (prev) boxContainer.appendChild(createBox(prev));
            const { color, from } = dragData;
            target.textContent = words[color];
            target.style.color = color;
            target.dataset.filled = color;
            if (from === 'box') {
                const orig = boxContainer.querySelector(`.draggable-box[data-color="${color}"]`);
                if (orig) orig.remove();
            }
            checkAllFilled();
            dragData = null;
        });

        target.addEventListener('dragend', () => {
            if (dragData && dragData.from === 'target') {
                boxContainer.appendChild(createBox(dragData.color));
                checkAllFilled();
                dragData = null;
            }
        });
    });
}

function checkAllFilled() {
    const all = Array.from(document.querySelectorAll('.drop-target'));
    openBtn.style.display = all.every(t => t.dataset.filled) && !puzzleSolved ? 'inline-block' : 'none';
}

function handleOpen() {
    if (puzzleSolved) return;
    feedback.textContent = '';

    const order = Array.from(document.querySelectorAll('.drop-target')).map(t => t.dataset.filled);
    if (order.join() !== correctOrder.join()) {
        feedback.textContent = 'ЧТО-ТО НЕ ТО!';
        return;
    }

    puzzleSolved = true;
    prompt.style.display = 'none';
    GameState.completePuzzle('chest');
    window.audio.stopBgm();

    const chestAudio = window.audio.playChestOpen();
    wizardImg.src = 'chest_opened.png';
    overlay.style.display = 'none';
    inDialog = false;

    if (chestAudio) {
        chestAudio.addEventListener('ended', showVictory);
    } else {
        setTimeout(showVictory, 1000);
    }
}

function showVictory() {
    overlay.style.display = 'block';
    inDialog = true;
    dialogText.innerHTML = 'ПОЗДРАВЛЯЕМ С ДНЕМ РОЖДЕНИЯ!<br/>' +
        '<a href="https://www.dropbox.com/scl/fo/sxdd5av6abmt056n0bxum/AB-go8UkY4cgGymUURRjp2I?rlkey=gxyqwg9usl2mfaw4nhqfz3ldk&st=82rgybh1&dl=0" target="_blank" style="display:inline-block;margin-top:24px;font-size:32px;color:#fff;background:#1976d2;padding:14px 28px;text-decoration:none;border-radius:16px;font-weight:bold;box-shadow:0 4px 16px rgba(30,80,180,0.16);transition:background 0.2s;">ВОТ ТУТ ТВОИ ПОДАРКИ!</a>';
    boxContainer.innerHTML = '';
    openBtn.style.display = 'none';
    feedback.textContent = '';
    window.audio.playVictory();
    startConfetti();
}

function startConfetti() {
    if (confettiActive) return;
    confettiActive = true;

    const confettiCanvas = document.createElement('div');
    confettiCanvas.id = 'confetti-canvas';
    confettiCanvas.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:99999;';
    document.body.appendChild(confettiCanvas);

    function spawnConfetto() {
        if (!confettiActive) return;
        const confetto = document.createElement('div');
        const size = Math.random() * 16 + 8;
        confetto.style.cssText = `position:absolute;width:${size}px;height:${size * 0.5}px;background:${confettiColors[Math.floor(Math.random() * confettiColors.length)]};border-radius:${size / 3}px;left:${Math.random() * window.innerWidth}px;top:-32px;opacity:${Math.random() * 0.4 + 0.6};transform:rotate(${Math.random() * 360}deg);pointer-events:none;`;
        confettiCanvas.appendChild(confetto);

        const duration = Math.random() * 2 + 2.5;
        const xDrift = (Math.random() - 0.5) * 120;
        const keyframes = [
            { transform: confetto.style.transform, top: '-32px', left: confetto.style.left },
            { transform: `rotate(${360 + Math.random() * 180}deg)`, top: `${window.innerHeight + 32}px`, left: `calc(${confetto.style.left} + ${xDrift}px)` }
        ];
        confetto.animate(keyframes, { duration: duration * 1000, easing: 'linear' });
        setTimeout(() => confetto.remove(), duration * 1000);
    }

    function confettiLoop() {
        if (!confettiActive) return;
        for (let i = 0; i < 7; i++) setTimeout(spawnConfetto, i * 80);
        setTimeout(confettiLoop, 180);
    }
    confettiLoop();
}

function checkProximity() {
    if (puzzleSolved) { prompt.style.display = 'none'; return; }
    const wizardX = (gameContainer.clientWidth - PLAYER_WIDTH) / 2;
    prompt.style.display = !inDialog && Math.abs(player.offsetLeft - wizardX) < PLAYER_WIDTH * 0.6 ? 'block' : 'none';
}

function gameLoop() {
    if (!inDialog && !puzzleSolved) {
        if (keys['arrowleft'] || keys['a']) {
            player.style.left = Math.max(LEFT_LIMIT, player.offsetLeft - 4) + 'px';
            player.classList.add('flipped');
        }
        if (keys['arrowright'] || keys['d']) {
            player.style.left = Math.min(RIGHT_LIMIT, player.offsetLeft + 4) + 'px';
            player.classList.remove('flipped');
        }
        if ((keys[' '] || keys['arrowup'] || keys['w']) && !isJumping) {
            isJumping = true;
            jumpSpeed = 15;
            window.audio.playJump();
        }
    }

    if (isJumping) {
        const bottom = parseFloat(player.style.bottom) || 0;
        player.style.bottom = bottom + jumpSpeed + 'px';
        jumpSpeed -= 0.8;
        if (bottom + jumpSpeed <= 80) {
            player.style.bottom = '80px';
            isJumping = false;
        }
    }

    checkProximity();
    animationId = requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    animationId = requestAnimationFrame(gameLoop);
}

function cleanup() {
    if (animationId) cancelAnimationFrame(animationId);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    confettiActive = false;
}

export default { init, render, cleanup };
