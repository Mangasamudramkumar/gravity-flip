// Level Design & Object Manager for Gravity Flip

class Platform {
    constructor(x, y, w, h, type = 'solid', config = {}) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.type = type; // 'solid', 'disappearing', 'moving'
        this.solid = true;
        this.active = true;

        // Disappearing properties
        this.triggered = false;
        this.timer = 0;
        this.respawnTimer = 0;

        // Moving properties
        this.startX = x;
        this.startY = y;
        this.endX = config.endX || x;
        this.endY = config.endY || y;
        this.speed = config.speed || 120;
        this.progress = 0;
        this.direction = 1;
        this.dx = 0;
        this.dy = 0;
    }

    update(dt) {
        if (this.type === 'disappearing') {
            if (this.triggered) {
                this.timer -= dt;
                if (this.timer <= 0) {
                    this.active = false;
                    this.solid = false;
                    this.triggered = false;
                    this.respawnTimer = 2.4; // 2.4s to reappear
                }
            } else if (!this.active) {
                this.respawnTimer -= dt;
                if (this.respawnTimer <= 0) {
                    this.active = true;
                    this.solid = true;
                }
            }
        } else if (this.type === 'moving') {
            const dist = Math.hypot(this.endX - this.startX, this.endY - this.startY);
            if (dist > 0) {
                this.progress += (this.speed / dist) * dt * this.direction;
                if (this.progress >= 1) {
                    this.progress = 1;
                    this.direction = -1;
                } else if (this.progress <= 0) {
                    this.progress = 0;
                    this.direction = 1;
                }
                const targetX = this.startX + (this.endX - this.startX) * this.progress;
                const targetY = this.startY + (this.endY - this.startY) * this.progress;

                this.dx = targetX - this.x;
                this.dy = targetY - this.y;
                this.x = targetX;
                this.y = targetY;
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        if (this.type === 'disappearing' && this.triggered) {
            ctx.globalAlpha = Math.max(0.2, this.timer / 0.35);
        }

        // Cyberpunk Platform Styling
        let strokeColor = '#00f0ff';
        let fillColor = 'rgba(0, 240, 255, 0.12)';

        if (this.type === 'disappearing') {
            strokeColor = '#ff2a55';
            fillColor = 'rgba(255, 42, 85, 0.15)';
        } else if (this.type === 'moving') {
            strokeColor = '#ffe600';
            fillColor = 'rgba(255, 230, 0, 0.15)';
        }

        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 10;

        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        // Tech grid lines on top border
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.w, this.y);
        ctx.stroke();

        ctx.restore();
    }
}

class Spike {
    constructor(x, y, w, h, dir = 'up', config = {}) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.dir = dir; // 'up', 'down', 'left', 'right'
        
        // Moving spike properties
        this.isMoving = config.isMoving || false;
        this.startX = x;
        this.startY = y;
        this.endX = config.endX || x;
        this.endY = config.endY || y;
        this.speed = config.speed || 100;
        this.progress = 0;
        this.moveDir = 1;
    }

    update(dt) {
        if (this.isMoving) {
            const dist = Math.hypot(this.endX - this.startX, this.endY - this.startY);
            if (dist > 0) {
                this.progress += (this.speed / dist) * dt * this.moveDir;
                if (this.progress >= 1) {
                    this.progress = 1;
                    this.moveDir = -1;
                } else if (this.progress <= 0) {
                    this.progress = 0;
                    this.moveDir = 1;
                }
                this.x = this.startX + (this.endX - this.startX) * this.progress;
                this.y = this.startY + (this.endY - this.startY) * this.progress;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ff2a55';
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff2a55';
        ctx.shadowBlur = 8;

        const count = Math.max(1, Math.floor(this.w / 16));
        const spikeW = this.w / count;

        ctx.beginPath();
        for (let i = 0; i < count; i++) {
            const sx = this.x + i * spikeW;
            if (this.dir === 'up') {
                ctx.moveTo(sx, this.y + this.h);
                ctx.lineTo(sx + spikeW / 2, this.y);
                ctx.lineTo(sx + spikeW, this.y + this.h);
            } else if (this.dir === 'down') {
                ctx.moveTo(sx, this.y);
                ctx.lineTo(sx + spikeW / 2, this.y + this.h);
                ctx.lineTo(sx + spikeW, this.y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class Laser {
    constructor(x, y, w, h, activeTime = 1.8, inactiveTime = 1.8) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.activeTime = activeTime;
        this.inactiveTime = inactiveTime;
        this.timer = 0;
        this.active = true;
    }

    update(dt) {
        this.timer += dt;
        const cycle = this.activeTime + this.inactiveTime;
        const current = this.timer % cycle;
        this.active = current < this.activeTime;
    }

    draw(ctx) {
        ctx.save();
        // Emitter caps
        ctx.fillStyle = '#444';
        ctx.fillRect(this.x - 4, this.y - 4, 8, this.h + 8);
        ctx.fillRect(this.x + this.w - 4, this.y - 4, 8, this.h + 8);

        if (this.active) {
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ff007f';
            ctx.fillRect(this.x, this.y, this.w, this.h);

            // Bright core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x, this.y + this.h * 0.3, this.w, this.h * 0.4);
        } else {
            // Warning beam outline
            ctx.strokeStyle = 'rgba(255, 0, 127, 0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
        ctx.restore();
    }
}

class Checkpoint {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = 32;
        this.h = 50;
        this.active = false;
    }

    draw(ctx) {
        ctx.save();
        const baseColor = this.active ? '#00ff66' : '#7184a0';
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = this.active ? 15 : 4;

        // Pole
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 6, this.y + this.h);
        ctx.lineTo(this.x + 6, this.y);
        ctx.stroke();

        // Flag banner
        ctx.fillStyle = this.active ? 'rgba(0, 255, 102, 0.4)' : 'rgba(113, 132, 160, 0.2)';
        ctx.beginPath();
        ctx.moveTo(this.x + 6, this.y + 4);
        ctx.lineTo(this.x + 30, this.y + 14);
        ctx.lineTo(this.x + 6, this.y + 24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 11;
        this.collected = false;
        this.angle = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.angle += 4 * dt;
    }

    draw(ctx) {
        if (this.collected) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Floating animation offset
        const floatY = Math.sin(this.angle) * 3;
        ctx.translate(0, floatY);

        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 12;

        // Spinning outer ring
        const scaleX = Math.cos(this.angle);
        ctx.scale(scaleX, 1);

        ctx.fillStyle = '#ffe600';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class ExitPortal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 36;
        this.angle = 0;
    }

    update(dt) {
        this.angle += 3 * dt;
    }

    draw(ctx, particleSystem) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Vortex Rings
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 20;

        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(this.angle * (i % 2 === 0 ? 1 : -1) + (i * Math.PI / 3));
            ctx.strokeStyle = i === 0 ? '#00f0ff' : (i === 1 ? '#ff007f' : '#9d00ff');
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius - i * 6, (this.radius - i * 6) * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Emit particles
        if (particleSystem && Math.random() < 0.6) {
            particleSystem.createPortalVortex(this.x, this.y);
        }
    }
}

// Master Level Container
class Level {
    constructor() {
        this.width = 5200;
        this.height = 576;
        this.spawnPoint = { x: 80, y: 400 };

        this.platforms = [];
        this.spikes = [];
        this.lasers = [];
        this.coins = [];
        this.checkpoints = [];
        this.portal = null;
        this.hints = [];

        this.buildLevel();
    }

    buildLevel() {
        // --- BOUNDARY CEILING & FLOORS ---
        // Section 1: Ground Start (0 to 850)
        this.platforms.push(new Platform(0, 480, 850, 96, 'solid'));
        this.platforms.push(new Platform(0, 0, 850, 40, 'solid')); // Ceiling

        // Tutorial hints
        this.hints.push({ x: 220, y: 420, text: "A / D : MOVE" });
        this.hints.push({ x: 400, y: 420, text: "SPACE : JUMP" });
        this.hints.push({ x: 620, y: 420, text: "SHIFT : FLIP GRAVITY!" });

        // Coins Section 1
        this.coins.push(new Coin(300, 440));
        this.coins.push(new Coin(500, 440));
        this.coins.push(new Coin(720, 100)); // High ceiling orb

        // --- SECTION 2: THE GREAT ABYSS & CEILING RUN (850 to 1800) ---
        // Spikes across bottom floor pit
        this.spikes.push(new Spike(850, 550, 950, 26, 'up'));

        // Overhead ceiling platforms across gap
        this.platforms.push(new Platform(850, 0, 400, 40, 'solid'));
        this.platforms.push(new Platform(1400, 0, 400, 40, 'solid'));

        // Mid-gap ceiling hazard forces a flip!
        this.spikes.push(new Spike(1250, 40, 150, 24, 'down'));

        // Island platform in mid-air
        this.platforms.push(new Platform(1200, 280, 220, 30, 'solid'));

        // Landing floor after pit
        this.platforms.push(new Platform(1800, 480, 400, 96, 'solid'));
        this.platforms.push(new Platform(1800, 0, 400, 40, 'solid'));

        // Coins Section 2
        this.coins.push(new Coin(980, 80));
        this.coins.push(new Coin(1310, 240));
        this.coins.push(new Coin(1600, 80));

        // Checkpoint 1
        this.checkpoints.push(new Checkpoint(1, 1850, 430));

        // --- SECTION 3: DISAPPEARING & MOVING DYNAMICS (2200 to 3200) ---
        // Spike pit 2
        this.spikes.push(new Spike(2200, 550, 1000, 26, 'up'));
        this.spikes.push(new Spike(2200, 0, 1000, 26, 'down'));

        // Disappearing platforms series
        this.platforms.push(new Platform(2250, 420, 120, 24, 'disappearing'));
        this.platforms.push(new Platform(2450, 140, 120, 24, 'disappearing'));
        this.platforms.push(new Platform(2650, 360, 120, 24, 'disappearing'));

        // Moving platforms
        this.platforms.push(new Platform(2850, 260, 140, 24, 'moving', { endX: 3150, endY: 260, speed: 140 }));

        // Laser obstacle
        this.lasers.push(new Laser(2520, 170, 8, 180, 2.0, 1.5));

        // Landing platform 3
        this.platforms.push(new Platform(3200, 480, 350, 96, 'solid'));
        this.platforms.push(new Platform(3200, 0, 350, 40, 'solid'));

        // Coins Section 3
        this.coins.push(new Coin(2310, 380));
        this.coins.push(new Coin(2510, 100));
        this.coins.push(new Coin(2710, 320));
        this.coins.push(new Coin(3000, 220));

        // Checkpoint 2
        this.checkpoints.push(new Checkpoint(2, 3250, 430));

        // --- SECTION 4: THE INVERSION GAUNTLET (3550 to 4500) ---
        // Spike pit 3 with moving spikes
        this.spikes.push(new Spike(3550, 550, 900, 26, 'up'));
        this.spikes.push(new Spike(3550, 0, 900, 26, 'down'));

        // Vertical moving platform
        this.platforms.push(new Platform(3600, 420, 130, 24, 'moving', { endX: 3600, endY: 120, speed: 130 }));

        // Mid-gauntlet ceiling & floor structures
        this.platforms.push(new Platform(3800, 120, 200, 24, 'solid'));
        this.platforms.push(new Platform(4050, 420, 200, 24, 'solid'));

        // Moving hazard spike sliding back and forth on solid block
        this.spikes.push(new Spike(3820, 94, 60, 26, 'down', { isMoving: true, endX: 3940, endY: 94, speed: 90 }));

        // Dual Lasers
        this.lasers.push(new Laser(4000, 144, 8, 276, 1.6, 1.2));

        // Final safe platform before exit
        this.platforms.push(new Platform(4450, 480, 750, 96, 'solid'));
        this.platforms.push(new Platform(4450, 0, 750, 40, 'solid'));

        // Coins Section 4
        this.coins.push(new Coin(3660, 250));
        this.coins.push(new Coin(3900, 160));
        this.coins.push(new Coin(4150, 380));
        this.coins.push(new Coin(4350, 260));

        // Checkpoint 3
        this.checkpoints.push(new Checkpoint(3, 4500, 430));

        // --- SECTION 5: EXIT PORTAL (4800+) ---
        this.portal = new ExitPortal(4950, 380);
        this.coins.push(new Coin(4950, 290)); // Final 15th coin!
    }

    update(dt) {
        for (const p of this.platforms) p.update(dt);
        for (const s of this.spikes) s.update(dt);
        for (const l of this.lasers) l.update(dt);
        for (const c of this.coins) c.update(dt);
        if (this.portal) this.portal.update(dt);
    }

    draw(ctx, particleSystem) {
        // Render tutorial hints
        ctx.save();
        ctx.font = '16px "Orbitron", sans-serif';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        for (const hint of this.hints) {
            ctx.fillText(hint.text, hint.x, hint.y);
        }
        ctx.restore();

        // Render game objects
        for (const p of this.platforms) p.draw(ctx);
        for (const s of this.spikes) s.draw(ctx);
        for (const l of this.lasers) l.draw(ctx);
        for (const c of this.coins) c.draw(ctx);
        for (const cp of this.checkpoints) cp.draw(ctx);
        if (this.portal) this.portal.draw(ctx, particleSystem);
    }
}
