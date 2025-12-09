/**
 * Main Game Application
 * Coordinates engine, UI, and controls
 */

import { Game2048 } from './engine.js';
import { StorageManager } from './storage.js';

// Initialize
const game = new Game2048();
const storage = new StorageManager();

// DOM Elements
const tileContainer = document.getElementById('tileContainer');
const currentScoreEl = document.getElementById('currentScore');
const bestScoreEl = document.getElementById('bestScore');
const newGameBtn = document.getElementById('newGameBtn');
const undoBtn = document.getElementById('undoBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const winOverlay = document.getElementById('winOverlay');
const finalScoreEl = document.getElementById('finalScore');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const winTryAgainBtn = document.getElementById('winTryAgainBtn');
const continueBtn = document.getElementById('continueBtn');

// Stats elements
const movesCountEl = document.getElementById('movesCount');
const maxTileEl = document.getElementById('maxTile');
const gamesPlayedEl = document.getElementById('gamesPlayed');
const gamesWonEl = document.getElementById('gamesWon');

// Settings
const animationsToggle = document.getElementById('animationsToggle');
const soundToggle = document.getElementById('soundToggle');
const resetDataBtn = document.getElementById('resetDataBtn');

// Game state
let moveCount = 0;

// Initialize
function init() {
    updateBestScore();
    updateStatistics();
    renderGrid();
    updateAchievements();

    // Load settings
    game.animationsEnabled = animationsToggle.checked;
    game.soundEnabled = soundToggle.checked;
}

// Game callbacks
game.onUpdate = (grid, score, info) => {
    if (!info.undo) {
        moveCount++;
    }
    updateScore(score);
    renderGrid();
    updateStats();
    undoBtn.disabled = game.history.length === 0;
};

game.onWin = () => {
    winOverlay.classList.remove('hidden');
    storage.incrementGamesWon();
    checkAchievements();
    updateStatistics();
};

game.onGameOver = (score) => {
    finalScoreEl.textContent = score;
    gameOverOverlay.classList.remove('hidden');
    storage.updateBestScore(score);
    updateBestScore();
    checkAchievements();
};

// New game
function startNewGame() {
    game.init();
    moveCount = 0;
    gameOverOverlay.classList.add('hidden');
    winOverlay.classList.add('hidden');
    updateScore(0);
    renderGrid();
    updateStats();
    undoBtn.disabled = true;
    storage.incrementGamesPlayed();
    updateStatistics();
}

newGameBtn.addEventListener('click', startNewGame);
tryAgainBtn.addEventListener('click', startNewGame);
winTryAgainBtn.addEventListener('click', startNewGame);

// Continue after win
continueBtn.addEventListener('click', () => {
    winOverlay.classList.add('hidden');
});

// Undo
undoBtn.addEventListener('click', () => {
    if (game.undo()) {
        moveCount = Math.max(0, moveCount - 1);
        updateStats();
    }
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameOverOverlay.classList.contains('hidden') &&
        winOverlay.classList.contains('hidden')) {

        let direction = null;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                direction = 'up';
                break;
            case 'ArrowDown':
                e.preventDefault();
                direction = 'down';
                break;
            case 'ArrowLeft':
                e.preventDefault();
                direction = 'left';
                break;
            case 'ArrowRight':
                e.preventDefault();
                direction = 'right';
                break;
        }

        if (direction) {
            game.move(direction);
        }
    }
});

// Touch controls
let touchStartX = 0;
let touchStartY = 0;

tileContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

tileContainer.addEventListener('touchend', (e) => {
    if (gameOverOverlay.classList.contains('hidden') &&
        winOverlay.classList.contains('hidden')) {

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        const minSwipeDistance = 30;

        if (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance) {
            if (Math.abs(dx) > Math.abs(dy)) {
                game.move(dx > 0 ? 'right' : 'left');
            } else {
                game.move(dy > 0 ? 'down' : 'up');
            }
        }
    }
});

// Render grid
function renderGrid() {
    tileContainer.innerHTML = '';

    for (let i = 0; i < game.size; i++) {
        for (let j = 0; j < game.size; j++) {
            const value = game.grid[i][j];
            if (value !== 0) {
                const tile = createTile(value, i, j);
                tileContainer.appendChild(tile);
            }
        }
    }
}

function createTile(value, row, col) {
    const tile = document.createElement('div');
    tile.className = `tile tile-${value}`;
    tile.textContent = value;

    // Position based on row and column
    const cellSize = 121.25;
    const gap = 15;
    tile.style.left = `${col * (cellSize + gap)}px`;
    tile.style.top = `${row * (cellSize + gap)}px`;

    return tile;
}

// Update score
function updateScore(score) {
    currentScoreEl.textContent = score;

    if (score > storage.getBestScore()) {
        storage.updateBestScore(score);
        updateBestScore();
    }
}

function updateBestScore() {
    bestScoreEl.textContent = storage.getBestScore();
}

// Update stats
function updateStats() {
    movesCountEl.textContent = moveCount;
    maxTileEl.textContent = game.getMaxTile();
}

function updateStatistics() {
    const stats = storage.getStatistics();
    gamesPlayedEl.textContent = stats.gamesPlayed;
    gamesWonEl.textContent = stats.gamesWon;
}

// Achievements
function checkAchievements() {
    const maxTile = game.getMaxTile();

    // First win
    if (maxTile >= 2048) {
        unlockAchievement('first-win');
    }

    // Speed demon
    if (maxTile >= 2048 && moveCount <= 100) {
        unlockAchievement('speed-demon');
    }

    // High roller
    if (maxTile >= 4096) {
        unlockAchievement('high-roller');
    }

    // Survivor
    if (moveCount >= 500) {
        unlockAchievement('survivor');
    }
}

function unlockAchievement(achievementId) {
    if (storage.unlockAchievement(achievementId)) {
        const element = document.querySelector(`[data-achievement="${achievementId}"]`);
        if (element) {
            element.classList.remove('locked');
            element.classList.add('unlocked');
        }
    }
}

function updateAchievements() {
    const unlockedAchievements = storage.getAchievements();
    unlockedAchievements.forEach(achievementId => {
        const element = document.querySelector(`[data-achievement="${achievementId}"]`);
        if (element) {
            element.classList.remove('locked');
            element.classList.add('unlocked');
        }
    });
}

// Settings
animationsToggle.addEventListener('change', (e) => {
    game.animationsEnabled = e.target.checked;
});

soundToggle.addEventListener('change', (e) => {
    game.soundEnabled = e.target.checked;
});

resetDataBtn.addEventListener('click', () => {
    if (confirm('정말 모든 데이터를 초기화하시겠습니까?')) {
        storage.clearData();
        updateBestScore();
        updateStatistics();
        updateAchievements();
        alert('데이터가 초기화되었습니다.');
    }
});

// Initialize app
init();
