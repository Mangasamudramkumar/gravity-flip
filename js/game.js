// Master Game Controller & Loop for Gravity Flip

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Core systems
        this.physics = new PhysicsEngine();
        this.particleSystem = new ParticleSystem();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.level = null;
        this.player = null;

        // Game State Management
        this.STATE_START = 'START';
        this.STATE_PLAYING = 'PLAYING';
        this.STATE_PAUSED = 'PAUSED';
        this.STATE_GAMEOVER = 'GAMEOVER';
        this.STATE_LEVEL_COMPLETE = 'LEVEL_COMPLETE';
        this.currentState = this.STATE_START;

        // Level Timer
        this.levelTime = 0;

        // Input state tracking
        this.keys = {};
        this.setupInputListeners();
        this.setupUIListeners();

        // Parallax Starfield Background
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * 2000,
                y: Math.random() * this.canvas.height,
                size: 1 + Math.random() * 2,
                speed: 0.2 + Math.random() * 0.5,
                color: Math.random() > 0.5 ? '#00f0ff' : '#ff007f'
            });
        }

        // Loop timing
        this.lastTime = 0;
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    initLevel() {
        this.level = new Level();
        this.player = new Player(this.level.spawnPoint.x, this.level.spawnPoint.y);
        this.particleSystem.clear();
        this.levelTime = 0;
    }

    setupInputListeners() {
        window.addEventListener('keydown', (e) => {
            audioEngine.init(); // Initialize audio context on keypress

            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.currentState === this.STATE_PLAYING) {
                    this.setGameState(this.STATE_PAUSED);
                } else if (this.currentState === this.STATE_PAUSED) {
                    this.setGameState(this.STATE_PLAYING);
                }
                return;
            }

            if (this.currentState !== this.STATE_PLAYING) return;

            this.keys[e.code] = true;

            // Immediate actions on keydown (Jump & Gravity Flip)
            if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.physics.executeJump(this.player, this.particleSystem, audioEngine);
            }

            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyS' || e.code === 'ArrowDown') {
                e.preventDefault();
                this.physics.executeGravityFlip(this.player, this.particleSystem, audioEngine);
            }

            if (e.code === 'KeyR') {
                this.player.kill('restart', this.particleSystem, audioEngine);
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    setupUIListeners() {
        const bindBtn = (id, handler) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    audioEngine.init();
                    audioEngine.playButtonClick();
                    handler();
                });
            }
        };

        bindBtn('btnPlay', () => {
            this.initLevel();
            this.setGameState(this.STATE_PLAYING);
        });

        bindBtn('btnHowToPlay', () => {
            document.getElementById('howToPlayModal').classList.remove('hidden');
        });

        bindBtn('btnCloseHowToPlay', () => {
            document.getElementById('howToPlayModal').classList.add('hidden');
        });

        bindBtn('btnResume', () => {
            this.setGameState(this.STATE_PLAYING);
        });

        bindBtn('btnRestartPause', () => {
            this.initLevel();
            this.setGameState(this.STATE_PLAYING);
        });

        bindBtn('btnQuit', () => {
            this.setGameState(this.STATE_START);
        });

        bindBtn('btnRetry', () => {
            this.initLevel();
            this.setGameState(this.STATE_PLAYING);
        });

        bindBtn('btnMenuFail', () => {
            this.setGameState(this.STATE_START);
        });

        bindBtn('btnPlayAgain', () => {
            this.initLevel();
            this.setGameState(this.STATE_PLAYING);
        });

        bindBtn('btnMenuSuccess', () => {
            this.setGameState(this.STATE_START);
        });
    }

    setGameState(newState) {
        this.currentState = newState;

        // Hide all screens
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');

        if (newState === this.STATE_START) {
            document.getElementById('startScreen').classList.remove('hidden');
        } else if (newState === this.STATE_PLAYING) {
            document.getElementById('hud').classList.remove('hidden');
        } else if (newState === this.STATE_PAUSED) {
            document.getElementById('hud').classList.remove('hidden');
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else if (newState === this.STATE_GAMEOVER) {
            document.getElementById('gameOverScreen').classList.remove('hidden');
            document.getElementById('finalScoreFail').innerText = this.player.score;
            document.getElementById('finalCoinsFail').innerText = `${this.player.coinsCollected} / ${this.level.coins.length}`;
        } else if (newState === this.STATE_LEVEL_COMPLETE) {
            document.getElementById('levelCompleteScreen').classList.remove('hidden');
            
            // Stats calculations
            const minutes = Math.floor(this.levelTime / 60);
            const seconds = Math.floor(this.levelTime % 60);
            const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const orbBonus = this.player.coinsCollected === this.level.coins.length ? 1500 : this.player.coinsCollected * 100;
            const timeBonus = Math.max(0, 3000 - Math.floor(this.levelTime) * 20);
            const totalScore = this.player.score + orbBonus + timeBonus;

            document.getElementById('completeTime').innerText = timeStr;
            document.getElementById('completeCoins').innerText = `${this.player.coinsCollected} / ${this.level.coins.length}`;
            document.getElementById('completeOrbBonus').innerText = `+${orbBonus}`;
            document.getElementById('completeTotalScore').innerText = totalScore;

            audioEngine.playLevelComplete();
        }
    }

    update(dt) {
        if (this.currentState !== this.STATE_PLAYING) return;

        this.levelTime += dt;

        // Player input direction check
        let dir = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dir -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dir += 1;
        this.player.inputDir = dir;

        // Update core entities
        this.player.update(dt, this.level, this.particleSystem, audioEngine, this.physics);
        this.level.update(dt);
        this.particleSystem.update(dt);
        this.camera.update(dt, this.player, this.level);

        // Check Out of Lives -> Game Over
        if (this.player.lives <= 0) {
            this.setGameState(this.STATE_GAMEOVER);
            return;
        }

        // Check Victory -> Exit Portal Overlap
        if (this.level.portal) {
            const dist = Math.hypot(
                (this.player.x + this.player.w / 2) - this.level.portal.x,
                (this.player.y + this.player.h / 2) - this.level.portal.y
            );
            if (dist < this.player.w / 2 + this.level.portal.radius) {
                this.setGameState(this.STATE_LEVEL_COMPLETE);
                return;
            }
        }

        // Update HUD display
        this.updateHUD();
    }

    updateHUD() {
        // Hearts
        const hearts = '❤️'.repeat(Math.max(0, this.player.lives));
        document.getElementById('hudLives').innerText = hearts;

        // Score
        document.getElementById('hudScore').innerText = this.player.score.toString().padStart(5, '0');

        // Coins
        document.getElementById('hudCoins').innerText = `🪙 ${this.player.coinsCollected} / ${this.level.coins.length}`;

        // Timer
        const mins = Math.floor(this.levelTime / 60);
        const secs = Math.floor(this.levelTime % 60);
        document.getElementById('hudTimer').innerText = `⏱️ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Gravity Badge
        const badge = document.getElementById('gravityBadge');
        const gravityText = document.getElementById('hudGravity');
        if (this.player.gravityDir > 0) {
            badge.className = 'hud-item gravity-container down';
            gravityText.innerText = 'DOWN';
        } else {
            badge.className = 'hud-item gravity-container up';
            gravityText.innerText = 'UP';
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Cyber Parallax Background
        this.renderBackground();

        if (this.level && this.player) {
            this.ctx.save();
            // Apply Camera Transform & Screen Shake
            this.ctx.translate(
                -Math.floor(this.camera.x) + this.camera.shakeX,
                -Math.floor(this.camera.y) + this.camera.shakeY
            );

            // 2. Render Level World & Hazards
            this.level.draw(this.ctx, this.particleSystem);

            // 3. Render Particles
            this.particleSystem.draw(this.ctx);

            // 4. Render Player
            this.player.draw(this.ctx);

            this.ctx.restore();
        }
    }

    renderBackground() {
        // Deep cyber navy fill
        this.ctx.fillStyle = '#05060c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Parallax stars
        for (const star of this.stars) {
            const scrollX = (star.x - (this.camera ? this.camera.x * star.speed : 0)) % this.canvas.width;
            const drawX = scrollX < 0 ? scrollX + this.canvas.width : scrollX;

            this.ctx.fillStyle = star.color;
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillRect(drawX, star.y, star.size, star.size);
        }
        this.ctx.globalAlpha = 1.0;

        // Subtle background grid
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
        this.ctx.lineWidth = 1;
        const gridSize = 40;
        const offsetX = this.camera ? -(this.camera.x * 0.2) % gridSize : 0;

        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000); // Cap frame delta to 50ms
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame(this.loop);
    }
}

// Start Game Engine on page load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
