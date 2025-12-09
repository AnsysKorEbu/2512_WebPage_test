/**
 * Timer Module
 * Handles Pomodoro timer logic
 */

export class Timer {
    constructor() {
        this.mode = 'pomodoro'; // pomodoro, short, long
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = 25 * 60; // seconds
        this.totalTime = 25 * 60;
        this.interval = null;
        this.onTick = null;
        this.onComplete = null;

        // Settings (default values)
        this.settings = {
            pomodoro: 25,
            short: 5,
            long: 15,
            autoStartBreak: false,
            soundEnabled: true
        };

        this.loadSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('pomodoroSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
    }

    setMode(mode) {
        this.stop();
        this.mode = mode;

        switch (mode) {
            case 'pomodoro':
                this.totalTime = this.settings.pomodoro * 60;
                break;
            case 'short':
                this.totalTime = this.settings.short * 60;
                break;
            case 'long':
                this.totalTime = this.settings.long * 60;
                break;
        }

        this.timeLeft = this.totalTime;
        this.isPaused = false;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;

        this.interval = setInterval(() => {
            this.timeLeft--;

            if (this.onTick) {
                this.onTick(this.timeLeft, this.totalTime);
            }

            if (this.timeLeft <= 0) {
                this.complete();
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = true;
        clearInterval(this.interval);
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.interval);
        this.timeLeft = this.totalTime;
    }

    reset() {
        this.stop();
        if (this.onTick) {
            this.onTick(this.timeLeft, this.totalTime);
        }
    }

    complete() {
        this.stop();

        if (this.settings.soundEnabled) {
            this.playSound();
        }

        if (this.onComplete) {
            this.onComplete(this.mode);
        }

        // Auto-start break if enabled
        if (this.settings.autoStartBreak && this.mode === 'pomodoro') {
            setTimeout(() => {
                this.setMode('short');
                this.start();
            }, 1000);
        }
    }

    playSound() {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    getTimeString() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    getProgress() {
        return 1 - (this.timeLeft / this.totalTime);
    }
}
