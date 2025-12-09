/**
 * Snake Game Engine
 * Main game logic and rendering
 */

export class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game settings
        this.gridSize = 20;
        this.tileCount = 25;
        this.tileSize = this.gridSize;

        // Set canvas size
        this.canvas.width = this.tileCount * this.tileSize;
        this.canvas.height = this.tileCount * this.tileSize;

        // Game state
        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = { x: 0, y: 0, isGolden: false };
        this.score = 0;
        this.level = 1;
        this.isPlaying = false;
        this.isPaused = false;
        this.gameLoop = null;
        this.speed = 150;
        this.startTime = 0;
        this.applesEaten = 0;

        // Cheats
        this.godMode = false;
        this.speedMultiplier = 1;

        // Settings
        this.soundEnabled = true;
        this.showGrid = true;

        // Callbacks
        this.onScoreUpdate = null;
        this.onGameOver = null;
    }

    init() {
        // Initialize snake in center
        const centerX = Math.floor(this.tileCount / 2);
        const centerY = Math.floor(this.tileCount / 2);

        this.snake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];

        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.level = 1;
        this.speed = 150;
        this.applesEaten = 0;
        this.isPaused = false;

        this.spawnFood();
        this.draw();
    }

    start() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.startTime = Date.now();
        this.gameLoop = setInterval(() => this.update(), this.speed / this.speedMultiplier);
    }

    pause() {
        this.isPaused = !this.isPaused;
    }

    stop() {
        this.isPlaying = false;
        clearInterval(this.gameLoop);
    }

    update() {
        if (this.isPaused || !this.isPlaying) return;

        // Update direction
        this.direction = { ...this.nextDirection };

        // Calculate new head position
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Check collision with walls
        if (!this.godMode && (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount)) {
            this.gameOver();
            return;
        }

        // Wrap around in god mode
        if (this.godMode) {
            if (head.x < 0) head.x = this.tileCount - 1;
            if (head.x >= this.tileCount) head.x = 0;
            if (head.y < 0) head.y = this.tileCount - 1;
            if (head.y >= this.tileCount) head.y = 0;
        }

        // Check collision with self
        if (!this.godMode && this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        // Add new head
        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            const points = this.food.isGolden ? 50 : 10;
            this.score += points;
            this.applesEaten++;

            // Level up every 5 apples
            if (this.applesEaten % 5 === 0) {
                this.levelUp();
            }

            this.spawnFood();
            this.playSound('eat');

            if (this.onScoreUpdate) {
                this.onScoreUpdate(this.score, this.level);
            }
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }

        this.draw();
    }

    setDirection(newDirection) {
        // Prevent 180-degree turns
        if (this.direction.x + newDirection.x === 0 && this.direction.y + newDirection.y === 0) {
            return;
        }
        this.nextDirection = newDirection;
    }

    spawnFood() {
        let newFood;
        let isValid = false;

        while (!isValid) {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
                isGolden: Math.random() < 0.1 // 10% chance for golden apple
            };

            // Check if food spawns on snake
            isValid = !this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
        }

        this.food = newFood;
    }

    levelUp() {
        this.level++;
        this.speed = Math.max(50, this.speed - 10);

        // Restart game loop with new speed
        clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), this.speed / this.speedMultiplier);

        this.playSound('levelup');
    }

    draw() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#0f1419';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        if (this.showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;

            for (let i = 0; i <= this.tileCount; i++) {
                ctx.beginPath();
                ctx.moveTo(i * this.tileSize, 0);
                ctx.lineTo(i * this.tileSize, this.canvas.height);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, i * this.tileSize);
                ctx.lineTo(this.canvas.width, i * this.tileSize);
                ctx.stroke();
            }
        }

        // Draw food
        ctx.fillStyle = this.food.isGolden ? '#ffd700' : '#ff4757';
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.food.isGolden ? '#ffd700' : '#ff4757';
        ctx.fillRect(
            this.food.x * this.tileSize + 2,
            this.food.y * this.tileSize + 2,
            this.tileSize - 4,
            this.tileSize - 4
        );
        ctx.shadowBlur = 0;

        // Draw snake
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Head
                ctx.fillStyle = '#00ff88';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#00ff88';
            } else {
                // Body
                const opacity = 1 - (index / this.snake.length) * 0.5;
                ctx.fillStyle = `rgba(0, 255, 136, ${opacity})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ff88';
            }

            ctx.fillRect(
                segment.x * this.tileSize + 1,
                segment.y * this.tileSize + 1,
                this.tileSize - 2,
                this.tileSize - 2
            );
        });

        ctx.shadowBlur = 0;
    }

    gameOver() {
        this.stop();
        this.playSound('gameover');

        const survivalTime = Math.floor((Date.now() - this.startTime) / 1000);

        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                level: this.level,
                applesEaten: this.applesEaten,
                survivalTime: survivalTime,
                cheatUsed: this.godMode || this.speedMultiplier !== 1
            });
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'eat':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'gameover':
                oscillator.frequency.value = 200;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
            case 'levelup':
                oscillator.frequency.value = 1000;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
        }
    }

    toggleGodMode() {
        this.godMode = !this.godMode;
        return this.godMode;
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        if (this.isPlaying) {
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.update(), this.speed / this.speedMultiplier);
        }
    }
}
