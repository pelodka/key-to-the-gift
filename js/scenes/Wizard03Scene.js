/**
 * Wizard 03 Scene - Quiz puzzle
 * Converted from wizard03.html
 */

import sceneManager from '../SceneManager.js';
import GameState from '../GameState.js';
import { PLAYER_WIDTH, createPhysicsState, applyGravity, handleMovement, handleJump, updatePlayerPosition, getSpawnPosition } from '../utils/physics.js';
import { createTouchControls } from '../utils/touchControls.js';

let player, gameContainer, prompt, overlay, greetBox, puzzleBox, wizardMsg, errorText;
let physics, keys, isJumping, jumpSpeed, interactionFinished, waitingBlock, puzzleSolved, blockSpawned, animationId;
let interactPressed = false;
const LEFT_LIMIT = 0;
let RIGHT_LIMIT;

function init(container, params) {
    const exitSide = params?.exitSide || GameState.exitSide;
    const gameWidth = container.clientWidth || 1920;
    RIGHT_LIMIT = gameWidth - PLAYER_WIDTH;

    const spawnX = getSpawnPosition(exitSide, gameWidth);
    physics = createPhysicsState(spawnX);
    keys = {};
    isJumping = false;
    jumpSpeed = 0;
    interactionFinished = GameState.isPuzzleComplete('wizard03');
    waitingBlock = false;
    puzzleSolved = GameState.isPuzzleComplete('wizard03');
    blockSpawned = false;
}

function render(container) {
    gameContainer = container;
    container.innerHTML = `
    <div id="player"></div>
    <div class="wizard" id="wizard">
      <img id="wizard-img" src="wizard3.png" alt="Wizard" />
      <div id="prompt" class="prompt">Press E</div>
      <div id="wizard-message" class="wizard-message"></div>
    </div>
    <div class="puzzle-overlay" id="puzzle-overlay">
      <div id="greet-box" class="dialog-box" style="display: none; padding: 48px; width: 900px; font-family: 'Arial Black';">
        <div>О, Саша, слава богу ты здесь! Надо срочно ответить на письмо из Финанзамт!</div>
      </div>
      <div id="puzzle-box" class="puzzle-box" style="display: none;">
        <h1>Чему вас научила немецко-армянская налоговая одиссея?</h1>
        <div id="error-text" style="display:none; margin:16px 0; font-size:30px; color:red; text-align:center;">Эх, все же придется звонить KPMG!</div>
        <button class="puzzle-answer" data-correct="false">Провайдеры бывают глобальными, а ответственность нет</button>
        <button class="puzzle-answer" data-correct="false">В Finanzamt отвечают медленно, но зато верно</button>
        <button class="puzzle-answer" data-correct="false">Когда тебе отвечают "мы это уточним" — лучше начинай уточнять сам</button>
        <button class="puzzle-answer" data-correct="false">На лучшую налоговую консультацию к SVP R&D можно записаться через телеграм</button>
        <button class="puzzle-answer" data-correct="true">Все вышеперечисленное</button>
      </div>
    </div>
  `;

    player = container.querySelector('#player');
    prompt = container.querySelector('#prompt');
    overlay = container.querySelector('#puzzle-overlay');
    greetBox = container.querySelector('#greet-box');
    puzzleBox = container.querySelector('#puzzle-box');
    wizardMsg = container.querySelector('#wizard-message');
    errorText = container.querySelector('#error-text');

    player.style.left = physics.posX + 'px';
    player.style.bottom = '80px';

    // Add touch controls with interact button
    createTouchControls(container, keys, { includeJump: true, includeInteract: true });

    setupEventListeners();
    setupPuzzleAnswers();
    startGameLoop();
}

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === 'e') {
        window.audio.playInteract();
        const wizardX = (gameContainer.clientWidth - 320) / 2;
        const near = Math.abs(player.offsetLeft - wizardX) < 192;

        if (!interactionFinished && near) {
            startPlaceholder();
        } else if (puzzleSolved && near) {
            showFinalDialog();
        }
    }

    if (puzzleSolved) {
        const posX = player.offsetLeft;
        if ((key === 'arrowleft' || key === 'a') && posX <= LEFT_LIMIT) {
            sceneManager.loadScene('chest', { exitSide: 'left' });
        }
        if ((key === 'arrowright' || key === 'd') && posX >= RIGHT_LIMIT) {
            sceneManager.loadScene('chest', { exitSide: 'right' });
        }
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

function startPlaceholder() {
    interactionFinished = true;
    overlay.style.display = 'block';
    greetBox.style.display = 'block';

    function ack() {
        greetBox.style.display = 'none';
        puzzleBox.style.display = 'block';
    }

    overlay.addEventListener('click', ack, { once: true });
    document.addEventListener('keydown', ack, { once: true });
}

function setupPuzzleAnswers() {
    const answers = document.querySelectorAll('.puzzle-answer');
    answers.forEach(btn => {
        btn.addEventListener('click', () => {
            const correct = btn.dataset.correct === 'true';

            if (!correct) {
                puzzleBox.style.animation = 'shake 0.5s';
                errorText.style.display = 'block';

                function clearErr() {
                    puzzleBox.style.animation = '';
                    errorText.style.display = 'none';
                    document.removeEventListener('mousemove', clearErr);
                }
                document.addEventListener('mousemove', clearErr, { once: true });
            } else {
                overlay.style.display = 'none';
                puzzleSolved = true;
                GameState.completePuzzle('wizard03');
                puzzleBox.style.display = 'none';

                // Show Schwarz hint
                wizardMsg.innerHTML = 'Ну конечно! Спасибо тебе! Последняя подсказка - <strong>SCHWARZ</strong>';
                wizardMsg.style.display = 'block';

                function ackWizard() {
                    wizardMsg.style.display = 'none';
                    if (!blockSpawned) setupCollectible();
                }

                wizardMsg.addEventListener('click', ackWizard, { once: true });
                document.addEventListener('keydown', ackWizard, { once: true });
            }
        });
    });
}

function setupCollectible() {
    blockSpawned = true;
    waitingBlock = true;
    player.classList.add('hands-up');

    const block = document.createElement('div');
    block.className = 'collect-block';
    block.style.background = 'black';
    const xPos = (player.offsetLeft + (320 - 60) / 2) + 'px';
    block.style.left = xPos;
    block.style.bottom = (80 + 320 + 10) + 'px';
    gameContainer.appendChild(block);

    block.addEventListener('click', () => {
        block.style.transition = 'all 0.5s ease-out';
        block.style.left = '0px';
        block.style.bottom = (gameContainer.clientHeight - 40) + 'px';

        block.addEventListener('transitionend', () => {
            block.remove();
            waitingBlock = false;
            GameState.collectBlock('black');
            player.classList.remove('hands-up');
        }, { once: true });
    });
}

function showFinalDialog() {
    wizardMsg.innerHTML = 'Отлично! Осталось совсем чуть-чуть! Не отступай!';
    wizardMsg.style.display = 'block';
    wizardMsg.addEventListener('click', () => { wizardMsg.style.display = 'none'; }, { once: true });
    document.addEventListener('keydown', () => { wizardMsg.style.display = 'none'; }, { once: true });
}

function checkProximity() {
    const wizardX = (gameContainer.clientWidth - 320) / 2;
    const near = Math.abs(player.offsetLeft - wizardX) < 192;
    const show = !waitingBlock && near && (!interactionFinished || puzzleSolved);
    prompt.style.display = show ? 'block' : 'none';
}

function gameLoop() {
    // Handle touch E button interaction
    if (keys['e'] && !interactPressed) {
        interactPressed = true;
        const wizardX = (gameContainer.clientWidth - 320) / 2;
        const near = Math.abs(player.offsetLeft - wizardX) < 192;

        if (near) {
            window.audio.playInteract();
            if (!interactionFinished) {
                startPlaceholder();
            } else if (puzzleSolved) {
                showFinalDialog();
            }
        }
    }
    if (!keys['e']) {
        interactPressed = false;
    }

    if (!waitingBlock) {
        if (keys['arrowleft'] || keys['a']) {
            player.style.left = Math.max(0, player.offsetLeft - 4) + 'px';
            player.classList.add('flipped');
        }
        if (keys['arrowright'] || keys['d']) {
            player.style.left = Math.min(gameContainer.clientWidth - 320, player.offsetLeft + 4) + 'px';
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

    // Handle scene transitions for mobile touch controls
    if (puzzleSolved) {
        const posX = player.offsetLeft;
        if ((keys['arrowleft'] || keys['a']) && posX <= LEFT_LIMIT) {
            sceneManager.loadScene('chest', { exitSide: 'left' });
        }
        if ((keys['arrowright'] || keys['d']) && posX >= RIGHT_LIMIT) {
            sceneManager.loadScene('chest', { exitSide: 'right' });
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
