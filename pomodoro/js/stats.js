/**
 * Stats Module
 * Tracks pomodoro statistics
 */

export class StatsManager {
    constructor() {
        this.stats = {
            totalPomodoros: 0,
            todayPomodoros: 0,
            lastDate: null
        };
        this.loadStats();
        this.checkNewDay();
    }

    loadStats() {
        const saved = localStorage.getItem('pomodoroStats');
        if (saved) {
            this.stats = JSON.parse(saved);
        }
    }

    saveStats() {
        localStorage.setItem('pomodoroStats', JSON.stringify(this.stats));
    }

    checkNewDay() {
        const today = new Date().toDateString();
        if (this.stats.lastDate !== today) {
            this.stats.todayPomodoros = 0;
            this.stats.lastDate = today;
            this.saveStats();
        }
    }

    incrementPomodoro() {
        this.checkNewDay();
        this.stats.totalPomodoros++;
        this.stats.todayPomodoros++;
        this.saveStats();
    }

    getTodayCount() {
        this.checkNewDay();
        return this.stats.todayPomodoros;
    }

    getTotalCount() {
        return this.stats.totalPomodoros;
    }
}
