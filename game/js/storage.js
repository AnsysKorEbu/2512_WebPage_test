/**
 * Storage for game data and leaderboard
 */

export class GameStorage {
    constructor() {
        this.STORAGE_KEY = 'snakeGameData';
    }

    // Load all data
    loadData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : {
            highScore: 0,
            leaderboard: []
        };
    }

    // Save all data
    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    // Get high score
    getHighScore() {
        const data = this.loadData();
        return data.highScore || 0;
    }

    // Save score (if not cheated)
    saveScore(score, level, applesEaten, survivalTime, cheatUsed) {
        if (cheatUsed) return false; // Don't save if cheats were used

        const data = this.loadData();

        // Update high score
        const isNewHighScore = score > data.highScore;
        if (isNewHighScore) {
            data.highScore = score;
        }

        // Add to leaderboard
        data.leaderboard.push({
            score: score,
            level: level,
            apples: applesEaten,
            time: survivalTime,
            date: new Date().toISOString()
        });

        // Sort and keep top 10
        data.leaderboard.sort((a, b) => b.score - a.score);
        data.leaderboard = data.leaderboard.slice(0, 10);

        this.saveData(data);
        return isNewHighScore;
    }

    // Get leaderboard
    getLeaderboard() {
        const data = this.loadData();
        return data.leaderboard || [];
    }

    // Clear all data
    clearData() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
