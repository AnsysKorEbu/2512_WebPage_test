/**
 * Main Application
 * Coordinates timer, tasks, and UI
 */

import { Timer } from './timer.js';
import { TaskManager } from './tasks.js';
import { StatsManager } from './stats.js';

// Initialize modules
const timer = new Timer();
const taskManager = new TaskManager();
const statsManager = new StatsManager();

// DOM Elements
const timerDisplay = document.getElementById('timerDisplay');
const timerLabel = document.getElementById('timerLabel');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const modeBtns = document.querySelectorAll('.mode-btn');
const progressRing = document.querySelector('.progress-ring-progress');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const todayPomodoros = document.getElementById('todayPomodoros');
const totalPomodoros = document.getElementById('totalPomodoros');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModal = document.getElementById('closeModal');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

// Progress ring calculation
const radius = 135;
const circumference = 2 * Math.PI * radius;
progressRing.style.strokeDasharray = `${circumference} ${circumference}`;

// Initialize
function init() {
    updateTimerDisplay();
    updateProgress();
    renderTasks();
    updateStats();
    loadSettingsToModal();
}

// Timer callbacks
timer.onTick = (timeLeft, totalTime) => {
    updateTimerDisplay();
    updateProgress();
};

timer.onComplete = (mode) => {
    if (mode === 'pomodoro') {
        statsManager.incrementPomodoro();
        updateStats();
        showNotification('집중 세션 완료!', '휴식을 취하세요 🎉');
    } else {
        showNotification('휴식 종료!', '다시 집중할 시간입니다 💪');
    }
};

// Update timer display
function updateTimerDisplay() {
    timerDisplay.textContent = timer.getTimeString();

    const labels = {
        'pomodoro': '집중 시간',
        'short': '짧은 휴식',
        'long': '긴 휴식'
    };
    timerLabel.textContent = labels[timer.mode];

    // Update page title
    document.title = `${timer.getTimeString()} - Pomodoro Focus`;
}

// Update progress ring
function updateProgress() {
    const progress = timer.getProgress();
    const offset = circumference - (progress * circumference);
    progressRing.style.strokeDashoffset = offset;
}

// Timer controls
startBtn.addEventListener('click', () => {
    if (timer.isRunning) {
        timer.pause();
        startBtn.innerHTML = '<span class="btn-icon">▶</span><span>계속</span>';
    } else {
        timer.start();
        startBtn.innerHTML = '<span class="btn-icon">⏸</span><span>일시정지</span>';
    }
});

resetBtn.addEventListener('click', () => {
    timer.reset();
    startBtn.innerHTML = '<span class="btn-icon">▶</span><span>시작</span>';
});

// Mode selection
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        timer.setMode(mode);

        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        updateTimerDisplay();
        updateProgress();
        startBtn.innerHTML = '<span class="btn-icon">▶</span><span>시작</span>';
    });
});

// Task management
function renderTasks() {
    taskList.innerHTML = '';

    taskManager.tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;

        li.innerHTML = `
            <div class="task-checkbox"></div>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <span class="task-pomodoros">🍅 ${task.pomodoros}</span>
            <button class="task-delete">×</button>
        `;

        // Toggle completion
        li.querySelector('.task-checkbox').addEventListener('click', () => {
            taskManager.toggleTask(task.id);
            renderTasks();
            updateTaskCount();
        });

        // Delete task
        li.querySelector('.task-delete').addEventListener('click', () => {
            taskManager.deleteTask(task.id);
            renderTasks();
            updateTaskCount();
        });

        // Increment pomodoro on double-click
        li.addEventListener('dblclick', () => {
            if (!task.completed) {
                taskManager.incrementPomodoro(task.id);
                renderTasks();
            }
        });

        taskList.appendChild(li);
    });

    updateTaskCount();
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    taskManager.addTask(text);
    taskInput.value = '';
    renderTasks();
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

clearCompletedBtn.addEventListener('click', () => {
    if (confirm('완료된 모든 작업을 삭제하시겠습니까?')) {
        taskManager.clearCompleted();
        renderTasks();
    }
});

function updateTaskCount() {
    const count = taskManager.getTotalCount();
    const activeCount = taskManager.getActiveCount();
    taskCount.textContent = `${activeCount}개 작업`;
}

// Stats
function updateStats() {
    todayPomodoros.textContent = statsManager.getTodayCount();
    totalPomodoros.textContent = statsManager.getTotalCount();
}

// Settings Modal
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
    }
});

function loadSettingsToModal() {
    document.getElementById('pomodoroMinutes').value = timer.settings.pomodoro;
    document.getElementById('shortBreakMinutes').value = timer.settings.short;
    document.getElementById('longBreakMinutes').value = timer.settings.long;
    document.getElementById('autoStartBreak').checked = timer.settings.autoStartBreak;
    document.getElementById('soundEnabled').checked = timer.settings.soundEnabled;
}

saveSettingsBtn.addEventListener('click', () => {
    timer.settings.pomodoro = parseInt(document.getElementById('pomodoroMinutes').value);
    timer.settings.short = parseInt(document.getElementById('shortBreakMinutes').value);
    timer.settings.long = parseInt(document.getElementById('longBreakMinutes').value);
    timer.settings.autoStartBreak = document.getElementById('autoStartBreak').checked;
    timer.settings.soundEnabled = document.getElementById('soundEnabled').checked;

    timer.saveSettings();
    timer.setMode(timer.mode); // Refresh timer with new settings
    updateTimerDisplay();
    updateProgress();

    settingsModal.classList.remove('active');
    showNotification('설정이 저장되었습니다!', '');
});

// Notifications
function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '🍅' });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, { body, icon: '🍅' });
            }
        });
    }
}

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Utility
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize app
init();
