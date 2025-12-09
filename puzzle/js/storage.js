/**
 * Storage Manager
 * Handles localStorage for scores and statistics
 */

export class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'game2048Data';
    }

    loadData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : {
            bestScore: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            achievements: []
        };
    }

    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    getBestScore() {
        return this.loadData().bestScore || 0;
    }

    updateBestScore(score) {
        const data = this.loadData();
        if (score > data.bestScore) {
            data.bestScore = score;
            this.saveData(data);
            return true;
        }
        return false;
    }

    incrementGamesPlayed() {
        const data = this.loadData();
        data.gamesPlayed++;
        this.saveData(data);
    }

    incrementGamesWon() {
        const data = this.loadData();
        data.gamesWon++;
        this.saveData(data);
    }

    getStatistics() {
        const data = this.loadData();
        return {
            gamesPlayed: data.gamesPlayed || 0,
            gamesWon: data.gamesWon || 0
        };
    }

    unlockAchievement(achievementId) {
        const data = this.loadData();
        if (!data.achievements.includes(achievementId)) {
            data.achievements.push(achievementId);
            this.saveData(data);
            return true;
        }
        return false;
    }

    getAchievements() {
        return this.loadData().achievements || [];
    }

    clearData() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
