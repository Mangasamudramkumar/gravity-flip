// Player Class for Gravity Flip

class Player {
    constructor(startX, startY) {
        this.w = 32;
        this.h = 42;
        this.x = startX;
        this.y = startY;
        this.vx = 0;
        this.vy = 0;
        
        this.inputDir = 0; // -1, 0, 1
        this.facing = 1; // 1 = right, -1 = left
        this.gravityDir = 1; // 1 = DOWN, -1 = UP
        this.visualAngle = 0; // Smooth rotation angle in radians

        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.lastFlipTime = 0;

        this.lives = 3;
        this.score = 0;
        this.coinsCollected = 0;
        
        this.respawnPos = { x: startX, y: startY };
        this.isDead = false;
        this.respawnTimer = 0;

        this.animTimer = 0;
    }

    getBounds() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    update(dt, level, particleSystem, audioEngine, physicsEngine) {
        if (this.isDead) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }

        // Smooth visual rotation interpolation (0 rad for DOWN, Math.PI for UP)
        const targetAngle = this.gravityDir < 0 ? Math.PI : 0;
        const angleDiff = targetAngle - this.visualAngle;
        this.visualAngle += angleDiff * 14 * dt;

        // Running animation timer
        if (this.isGrounded && Math.abs(this.vx) > 20) {
            this.animTimer += dt * 15;
        }

        // Physics step
        physicsEngine.updatePlayer(this, level, dt, particleSystem, audioEngine);

        // Hazard & Trigger Overlaps
        this.checkHazardsAndCollectibles(level, particleSystem, audioEngine);
    }

    checkHazardsAndCollectibles(level, particleSystem, audioEngine) {
        const playerBox = this.getBounds();

        // 1. Spikes Collision
        for (const spike of level.spikes) {
            const sBox = { x: spike.x, y: spike.y, w: spike.w, h: spike.h };
            if (rectIntersect(playerBox, sBox)) {
                this.kill('spike', particleSystem, audioEngine);
                return;
            }
        }

        // 2. Active Lasers Collision
        for (const laser of level.lasers) {
            if (!laser.active) continue;
            const lBox = { x: laser.x, y: laser.y, w: laser.w, h: laser.h };
            if (rectIntersect(playerBox, lBox)) {
                this.kill('laser', particleSystem, audioEngine);
                return;
            }
        }

        // 3. Coins Collection
        for (const coin of level.coins) {
            if (coin.collected) continue;
            const dist = Math.hypot(
                (this.x + this.w / 2) - coin.x,
                (this.y + this.h / 2) - coin.y
            );
            if (dist < this.w / 2 + coin.radius) {
                coin.collected = true;
                this.coinsCollected++;
                this.score += 250;
                particleSystem.createCoinSparkle(coin.x, coin.y);
                audioEngine.playCoin();
            }
        }

        // 4. Checkpoints
        for (const cp of level.checkpoints) {
            const cpBox = { x: cp.x, y: cp.y, w: cp.w, h: cp.h };
            if (rectIntersect(playerBox, cpBox) && !cp.active) {
                cp.active = true;
                this.respawnPos = { x: cp.x, y: cp.y - 10 };
                particleSystem.createCheckpointBurst(cp.x + cp.w / 2, cp.y + cp.h / 2);
                audioEngine.playCheckpoint();
            }
        }
    }

    kill(reason, particleSystem, audioEngine) {
        if (this.isDead) return;

        this.lives--;
        this.isDead = true;
        this.respawnTimer = 0.8; // 0.8s death delay

        particleSystem.createDeathExplosion(this.x + this.w / 2, this.y + this.h / 2);
        audioEngine.playHazardHit();
    }

    respawn() {
        this.x = this.respawnPos.x;
        this.y = this.respawnPos.y;
        this.vx = 0;
        this.vy = 0;
        this.gravityDir = 1;
        this.visualAngle = 0;
        this.isGrounded = false;
        this.isDead = false;
    }

    draw(ctx) {
        if (this.isDead) return;

        ctx.save();
        // Pivot point at center of character box
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;
        ctx.translate(centerX, centerY);

        // Apply smooth gravity rotation
        ctx.rotate(this.visualAngle);

        // Flip horizontally based on facing direction
        if (this.facing < 0) {
            ctx.scale(-1, 1);
        }

        const halfW = this.w / 2;
        const halfH = this.h / 2;

        // --- ROBOT AVATAR DRAWING ---
        // 1. Core Body Frame
        ctx.fillStyle = '#12182b';
        ctx.strokeStyle = this.gravityDir > 0 ? '#00f0ff' : '#ff007f';
        ctx.lineWidth = 2;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 10;

        // Torso / Head combined sleek shell
        ctx.beginPath();
        ctx.roundRect(-halfW, -halfH, this.w, this.h, 6);
        ctx.fill();
        ctx.stroke();

        // 2. Visor / Glowing Eye
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(halfW - 14, -halfH + 8, 12, 8, 3);
        ctx.fill();

        // 3. Glowing Energy Core Matrix
        const coreColor = this.gravityDir > 0 ? '#00f0ff' : '#ff007f';
        ctx.fillStyle = coreColor;
        ctx.shadowColor = coreColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(-2, 2, 6, 0, Math.PI * 2);
        ctx.fill();

        // 4. Legs / Thruster Animations
        const legOffset = Math.sin(this.animTimer) * 4;
        ctx.fillStyle = '#7184a0';
        ctx.fillRect(-halfW + 4, halfH - 4, 8, 6 + (this.isGrounded ? legOffset : 0));
        ctx.fillRect(halfW - 12, halfH - 4, 8, 6 - (this.isGrounded ? legOffset : 0));

        // 5. Thruster spark if airborne
        if (!this.isGrounded) {
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.moveTo(-halfW + 6, halfH + 2);
            ctx.lineTo(0, halfH + 12);
            ctx.lineTo(halfW - 6, halfH + 2);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
