/**
 * Wizard 02 Scene - Document sorting puzzle
 * Converted from wizard02.html
 */

import sceneManager from '../SceneManager.js';
import GameState from '../GameState.js';
import { PLAYER_WIDTH, createPhysicsState, applyGravity, handleMovement, handleJump, updatePlayerPosition, getSpawnPosition } from '../utils/physics.js';
import { createTouchControls } from '../utils/touchControls.js';

let player, gameContainer, prompt, overlayPuzzle, dialogName, dialogTextPuzzle, blocksDiv;
let rejectContainer, approveContainer, rejectArea, approveArea;
let physics, keys, isJumping, jumpSpeed, interactionFinished, waitingBlock, puzzleSolved, animationId;
let interactPressed = false;
const LEFT_LIMIT = 0;
let RIGHT_LIMIT;

// Puzzle data
const rejectItems = [
    'Дресс-код для всех работников в любое время года - только черный костюм',
    'Объявление выговора работникам, не употреблявшим коньяк Арарат на последнем корпоративе',
    'Ձայնագրություն Երևանի աշխատակիցներին շտապաբար վերադարձնելու մասին Պետերբուրգ։',
    'Приказ об окончании COVID в связи со срочным переездом',
    'Приказ об ОБЯЗАТЕЛЬНОМ использовании eMM в работе всех департаментов'
];
const approveItems = [
    'Приказ о принятии политики использования софта в компании',
    'Приказ об установлении режима конфиденциальности в компании',
    'Приказ о предоставлении сотрудникам дополнительного выходного дня в течение года',
    'Приказ о порядке проведения корпоративных мероприятий',
    'Приказ о порядке утилизации мусора на территории компании'
];

let items, rejectSet, placedCount, totalCount;

function init(container, params) {
    const exitSide = params?.exitSide || GameState.exitSide;
    const gameWidth = container.clientWidth || 1920;
    RIGHT_LIMIT = gameWidth - PLAYER_WIDTH;

    const spawnX = getSpawnPosition(exitSide, gameWidth);
    physics = createPhysicsState(spawnX);
    keys = {};
    isJumping = false;
    jumpSpeed = 0;
    interactionFinished = GameState.isPuzzleComplete('wizard02');
    waitingBlock = false;
    puzzleSolved = GameState.isPuzzleComplete('wizard02');

    items = [...rejectItems, ...approveItems].sort(() => Math.random() - 0.5);
    rejectSet = new Set(rejectItems);
    placedCount = 0;
    totalCount = items.length;
}

function render(container) {
    gameContainer = container;
    container.innerHTML = `
    <div id="player"></div>
    <div class="wizard" id="wizard">
      <img id="wizard-img" src="wizard2.png" alt="Wizard" />
      <div id="prompt" class="prompt">Press E</div>
    </div>
    <div class="puzzle-overlay" id="puzzle-overlay">
      <div class="puzzle-box">
        <div id="dialog-name" style="text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 16px;"></div>
        <div id="dialog-text" style="text-align: center; font-size: 24px; margin-bottom: 24px;"></div>
        <div id="blocks" class="blocks-container"></div>
        <div class="drop-areas">
          <div id="rejectContainer" class="drop-area-container">
            <div id="rejectArea" class="drop-area">ОТКЛОНИТЬ</div>
          </div>
          <div id="approveContainer" class="drop-area-container">
            <div id="approveArea" class="drop-area">УТВЕРДИТЬ</div>
          </div>
        </div>
      </div>
    </div>
  `;

    player = container.querySelector('#player');
    prompt = container.querySelector('#prompt');
    overlayPuzzle = container.querySelector('#puzzle-overlay');
    dialogName = container.querySelector('#dialog-name');
    dialogTextPuzzle = container.querySelector('#dialog-text');
    blocksDiv = container.querySelector('#blocks');
    rejectContainer = container.querySelector('#rejectContainer');
    approveContainer = container.querySelector('#approveContainer');
    rejectArea = container.querySelector('#rejectArea');
    approveArea = container.querySelector('#approveArea');

    player.style.left = physics.posX + 'px';
    player.style.bottom = '80px';

    // Add touch controls with interact button
    createTouchControls(container, keys, { includeJump: true, includeInteract: true });

    setupEventListeners();
    setupDragDrop();
    startGameLoop();
}

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'e') {
        window.audio.playInteract();
        if (!interactionFinished) {
            startDialog();
        } else if (!waitingBlock) {
            overlayPuzzle.style.display = 'block';
            dialogTextPuzzle.textContent = 'Иди же дальше!';
            setTimeout(() => overlayPuzzle.style.display = 'none', 2000);
        }
    }

    if (puzzleSolved) {
        const posX = player.offsetLeft;
        if ((e.key.toLowerCase() === 'arrowleft' || e.key.toLowerCase() === 'a') && posX <= LEFT_LIMIT) {
            sceneManager.loadScene('wizard03', { exitSide: 'left' });
        }
        if ((e.key.toLowerCase() === 'arrowright' || e.key.toLowerCase() === 'd') && posX >= RIGHT_LIMIT) {
            sceneManager.loadScene('wizard03', { exitSide: 'right' });
        }
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

function startDialog() {
    interactionFinished = true;
    overlayPuzzle.style.display = 'block';
    dialogName.textContent = '';
    dialogTextPuzzle.textContent = 'Ох, как хорошо что ты здесь, Саша! Все приказы в моей папке перепутались, помоги разобраться!';

    const proceed = e => {
        if (e.type === 'keydown' && e.key.toLowerCase() === 'e') return;
        window.removeEventListener('keydown', proceed);
        window.removeEventListener('mousedown', proceed);
        showPuzzle();
    };

    window.addEventListener('keydown', proceed);
    window.addEventListener('mousedown', proceed);
}

function showPuzzle() {
    dialogName.textContent = 'НА ПОДПИСЬ';
    dialogTextPuzzle.textContent = '';
    blocksDiv.innerHTML = '';

    items.forEach((text, i) => {
        const d = document.createElement('div');
        d.className = 'block';
        d.textContent = text;
        d.draggable = true;
        d.id = 'block' + i;
        d.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', d.id));
        blocksDiv.appendChild(d);
    });

    blocksDiv.style.display = 'grid';
    rejectContainer.style.display = 'block';
    approveContainer.style.display = 'block';
}

function setupDragDrop() {
    [rejectArea, approveArea].forEach(area => {
        area.addEventListener('dragover', e => e.preventDefault());
        area.addEventListener('drop', e => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const block = document.getElementById(id);
            if (!block) return;

            const correct = (area === rejectArea) ? rejectSet.has(block.textContent) : !rejectSet.has(block.textContent);

            if (correct) {
                block.remove();
                placedCount++;
                if (placedCount === totalCount) finishPuzzle();
            } else {
                dialogTextPuzzle.innerHTML = '<span style="color: red;">Что на это скажет Марк?</span>';
                const puzzleBox = overlayPuzzle.querySelector('.puzzle-box');
                puzzleBox.classList.add('shake');
                puzzleBox.addEventListener('animationend', () => puzzleBox.classList.remove('shake'), { once: true });
                setTimeout(() => dialogTextPuzzle.textContent = '', 3000);
            }
        });
    });
}

function finishPuzzle() {
    dialogName.textContent = '';
    blocksDiv.style.display = 'none';
    rejectContainer.style.display = 'none';
    approveContainer.style.display = 'none';
    dialogTextPuzzle.innerHTML = 'Фух! Большое спасибо! Вот еще одна подсказка - <span style="color: gold; font-weight: bold;">GOLDEN</span>.';

    const proceed = e => {
        if (e.type === 'keydown' && e.key.toLowerCase() === 'e') return;
        window.removeEventListener('keydown', proceed);
        window.removeEventListener('mousedown', proceed);
        overlayPuzzle.style.display = 'none';
        setupCollectible();
        puzzleSolved = true;
        GameState.completePuzzle('wizard02');
    };

    window.addEventListener('keydown', proceed);
    window.addEventListener('mousedown', proceed);
}

function setupCollectible() {
    waitingBlock = true;
    player.classList.add('hands-up');

    const block = document.createElement('div');
    block.className = 'collect-block';
    block.style.background = 'gold';
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
            GameState.collectBlock('gold');
            player.classList.remove('hands-up');
        }, { once: true });
    });
}

function checkProximity() {
    const wizardX = (gameContainer.clientWidth - 320) / 2;
    prompt.style.display = (!waitingBlock && Math.abs(player.offsetLeft - wizardX) < 192) ? 'block' : 'none';
}

function gameLoop() {
    // Handle touch E button interaction
    if (keys['e'] && !interactPressed) {
        interactPressed = true;
        window.audio.playInteract();
        if (!interactionFinished) {
            startDialog();
        } else if (!waitingBlock) {
            overlayPuzzle.style.display = 'block';
            dialogTextPuzzle.textContent = 'Иди же дальше!';
            setTimeout(() => overlayPuzzle.style.display = 'none', 2000);
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
            sceneManager.loadScene('wizard03', { exitSide: 'left' });
        }
        if ((keys['arrowright'] || keys['d']) && posX >= RIGHT_LIMIT) {
            sceneManager.loadScene('wizard03', { exitSide: 'right' });
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
