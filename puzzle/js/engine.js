/**
 * 2048 Game Engine
 * Core game logic and grid management
 */

export class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.moved = false;
        this.won = false;
        this.over = false;
        this.history = [];
        this.maxHistorySize = 1;

        // Settings
        this.animationsEnabled = true;
        this.soundEnabled = true;

        // Callbacks
        this.onUpdate = null;
        this.onWin = null;
        this.onGameOver = null;

        this.init();
    }

    init() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.score = 0;
        this.won = false;
        this.over = false;
        this.addRandomTile();
        this.addRandomTile();
    }

    saveState() {
        this.history.push({
            grid: this.grid.map(row => [...row]),
            score: this.score
        });

        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    undo() {
        if (this.history.length === 0) return false;

        const state = this.history.pop();
        this.grid = state.grid;
        this.score = state.score;
        this.over = false;

        if (this.onUpdate) {
            this.onUpdate(this.grid, this.score, { undo: true });
        }

        return true;
    }

    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }

        if (emptyCells.length === 0) return;

        const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }

    move(direction) {
        if (this.over) return;

        this.saveState();
        this.moved = false;

        const rotatedGrid = this.rotateGrid(this.grid, direction);
        const { grid: movedGrid, score: addedScore, merged } = this.moveLeft(rotatedGrid);
        this.grid = this.rotateGrid(movedGrid, direction, true);

        if (addedScore > 0) {
            this.score += addedScore;
            this.playSound('merge');
        }

        if (this.moved) {
            this.addRandomTile();
            this.playSound('move');

            if (this.onUpdate) {
                this.onUpdate(this.grid, this.score, { merged });
            }

            // Check for win
            if (!this.won && this.hasValue(2048)) {
                this.won = true;
                if (this.onWin) {
                    this.onWin();
                }
            }

            // Check for game over
            if (this.isGameOver()) {
                this.over = true;
                if (this.onGameOver) {
                    this.onGameOver(this.score);
                }
            }
        }

        return this.moved;
    }

    rotateGrid(grid, direction, reverse = false) {
        switch (direction) {
            case 'left':
                return grid;
            case 'right':
                return grid.map(row => row.slice().reverse());
            case 'up':
                return this.transpose(grid);
            case 'down':
                return this.transpose(grid).map(row => row.slice().reverse());
        }
    }

    transpose(grid) {
        return grid[0].map((_, colIndex) => grid.map(row => row[colIndex]));
    }

    moveLeft(grid) {
        let score = 0;
        const merged = [];
        const newGrid = grid.map((row, rowIndex) => {
            const nonZero = row.filter(val => val !== 0);
            const newRow = [];

            for (let i = 0; i < nonZero.length; i++) {
                if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
                    const mergedValue = nonZero[i] * 2;
                    newRow.push(mergedValue);
                    score += mergedValue;
                    merged.push({ row: rowIndex, value: mergedValue });
                    i++;
                    this.moved = true;
                } else {
                    newRow.push(nonZero[i]);
                }
            }

            while (newRow.length < this.size) {
                newRow.push(0);
            }

            if (!this.arraysEqual(row, newRow)) {
                this.moved = true;
            }

            return newRow;
        });

        return { grid: newGrid, score, merged };
    }

    arraysEqual(a, b) {
        return a.length === b.length && a.every((val, index) => val === b[index]);
    }

    hasValue(value) {
        return this.grid.some(row => row.includes(value));
    }

    getMaxTile() {
        return Math.max(...this.grid.flat());
    }

    isGameOver() {
        // Check if there are any empty cells
        if (this.grid.some(row => row.includes(0))) {
            return false;
        }

        // Check if any adjacent cells can merge
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const current = this.grid[i][j];

                // Check right
                if (j < this.size - 1 && current === this.grid[i][j + 1]) {
                    return false;
                }

                // Check down
                if (i < this.size - 1 && current === this.grid[i + 1][j]) {
                    return false;
                }
            }
        }

        return true;
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'move':
                oscillator.frequency.value = 300;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
            case 'merge':
                oscillator.frequency.value = 600;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
        }
    }
}
