/**
 * Main Game Application
 * Coordinates game engine, UI, and controls
 */

import { SnakeGame } from './snake.js';
import { GameStorage } from './storage.js';

// Initialize
const canvas = document.getElementById('gameCanvas');
const game = new SnakeGame(canvas);
const storage = new GameStorage();

// DOM Elements
const currentScoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const currentLevelEl = document.getElementById('currentLevel');
const startScreen = document.getElementById('startScreen');
const pauseScreen = document.getElementById('pauseScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const finalScoreEl = document.getElementById('finalScore');
const applesEatenEl = document.getElementById('applesEaten');
const levelReachedEl = document.getElementById('levelReached');
const survivalTimeEl = document.getElementById('survivalTime');
const newHighScoreEl = document.getElementById('newHighScore');
const leaderboardEl = document.getElementById('leaderboard');

// Cheat buttons
const godModeBtn = document.getElementById('godModeBtn');
const slowMoBtn = document.getElementById('slowMoBtn');
const speedUpBtn = document.getElementById('speedUpBtn');

// Settings
const soundToggle = document.getElementById('soundToggle');
const gridToggle = document.getElementById('gridToggle');
const clearDataBtn = document.getElementById('clearDataBtn');

// Initialize
function init() {
    game.init();
    updateHighScore();
    updateLeaderboard();

    // Load settings
    soundToggle.checked = game.soundEnabled;
    gridToggle.checked = game.showGrid;
}

// Game callbacks
game.onScoreUpdate = (score, level) => {
    currentScoreEl.textContent = score;
    currentLevelEl.textContent = level;
};

game.onGameOver = (stats) => {
    finalScoreEl.textContent = stats.score;
    applesEatenEl.textContent = stats.applesEaten;
    levelReachedEl.textContent = stats.level;
    survivalTimeEl.textContent = stats.survivalTime + 's';

    // Check for new high score
    const isNewHighScore = storage.saveScore(
        stats.score,
        stats.level,
        stats.applesEaten,
        stats.survivalTime,
        stats.cheatUsed
    );

    if (isNewHighScore && !stats.cheatUsed) {
        newHighScoreEl.classList.remove('hidden');
        updateHighScore();
    } else {
        newHighScoreEl.classList.add('hidden');
    }

    updateLeaderboard();
    showScreen('gameOver');
};

// Start game
function startGame() {
    hideAllScreens();
    game.init();
    game.start();
    currentScoreEl.textContent = '0';
    currentLevelEl.textContent = '1';
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!game.isPlaying && e.key === ' ') {
        e.preventDefault();
        if (startScreen.classList.contains('hidden')) {
            startGame();
        }
        return;
    }

    if (game.isPlaying) {
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                game.setDirection({ x: 0, y: -1 });
                break;
            case 'ArrowDown':
                e.preventDefault();
                game.setDirection({ x: 0, y: 1 });
                break;
            case 'ArrowLeft':
                e.preventDefault();
                game.setDirection({ x: -1, y: 0 });
                break;
            case 'ArrowRight':
                e.preventDefault();
                game.setDirection({ x: 1, y: 0 });
                break;
            case ' ':
                e.preventDefault();
                game.pause();
                if (game.isPaused) {
                    showScreen('pause');
                } else {
                    hideAllScreens();
                }
                break;
        }
    }
});

// Button events
startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    game.stop();
    startGame();
});
resumeBtn.addEventListener('click', () => {
    game.pause();
    hideAllScreens();
});

// Cheat buttons
godModeBtn.addEventListener('click', () => {
    const isActive = game.toggleGodMode();
    godModeBtn.classList.toggle('active', isActive);
});

slowMoBtn.addEventListener('click', () => {
    const isActive = slowMoBtn.classList.toggle('active');
    game.setSpeedMultiplier(isActive ? 0.5 : 1);
    speedUpBtn.classList.remove('active');
});

speedUpBtn.addEventListener('click', () => {
    const isActive = speedUpBtn.classList.toggle('active');
    game.setSpeedMultiplier(isActive ? 2 : 1);
    slowMoBtn.classList.remove('active');
});

// Settings
soundToggle.addEventListener('change', (e) => {
    game.soundEnabled = e.target.checked;
});

gridToggle.addEventListener('change', (e) => {
    game.showGrid = e.target.checked;
    game.draw();
});

clearDataBtn.addEventListener('click', () => {
    if (confirm('정말로 모든 기록을 삭제하시겠습니까?')) {
        storage.clearData();
        updateHighScore();
        updateLeaderboard();
        alert('모든 기록이 삭제되었습니다.');
    }
});

// UI helpers
function showScreen(screen) {
    hideAllScreens();

    switch (screen) {
        case 'start':
            startScreen.classList.remove('hidden');
            break;
        case 'pause':
            pauseScreen.classList.remove('hidden');
            break;
        case 'gameOver':
            gameOverScreen.classList.remove('hidden');
            break;
    }
}

function hideAllScreens() {
    startScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
}

function updateHighScore() {
    const highScore = storage.getHighScore();
    highScoreEl.textContent = highScore;
}

function updateLeaderboard() {
    const leaderboard = storage.getLeaderboard();
    leaderboardEl.innerHTML = '';

    if (leaderboard.length === 0) {
        const li = document.createElement('li');
        li.className = 'loading';
        li.textContent = '기록 없음';
        leaderboardEl.appendChild(li);
        return;
    }

    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const date = new Date(entry.date).toLocaleDateString('ko-KR');

        li.innerHTML = `
            <span>${medal} ${entry.score}점</span>
            <span style="font-size: 0.8rem; color: #8892b0;">Lv.${entry.level}</span>
        `;
        leaderboardEl.appendChild(li);
    });
}

// Mobile touch controls (optional enhancement)
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    if (!game.isPlaying) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        game.setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    } else {
        // Vertical swipe
        game.setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    }
});

// Initialize app
init();
