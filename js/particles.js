// Particle System for Visual Effects in Gravity Flip
class Particle {
    constructor(x, y, vx, vy, size, color, life, type = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.maxSize = size;
        this.color = color;
        this.life = life; // Total lifetime in seconds
        this.maxLife = life;
        this.type = type; // 'circle', 'ring', 'spark', 'square'
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 8;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.rotation += this.rotSpeed * dt;

        // Shrink slightly over time
        if (this.type !== 'ring') {
            this.size = Math.max(0, this.maxSize * (this.life / this.maxLife));
        } else {
            this.size += 120 * dt; // Rings expand
        }
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;

        if (this.type === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'ring') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(1, this.size), 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === 'spark') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            ctx.moveTo(-this.size, 0);
            ctx.lineTo(this.size, 0);
            ctx.moveTo(0, -this.size);
            ctx.lineTo(0, this.size);
            ctx.stroke();
        } else if (this.type === 'square') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }

        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    clear() {
        this.particles = [];
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const p of this.particles) {
            p.draw(ctx);
        }
        ctx.restore();
    }

    // Effect: Gravity Flip shockwave burst
    createGravityFlipBurst(x, y, isUp) {
        const color = isUp ? '#ff007f' : '#00f0ff';
        
        // Expanding ring
        this.particles.push(new Particle(x, y, 0, 0, 10, color, 0.35, 'ring'));
        this.particles.push(new Particle(x, y, 0, 0, 5, '#ffffff', 0.25, 'ring'));

        // Radial sparks
        const count = 25;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 120 + Math.random() * 280;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 3 + Math.random() * 4;
            const life = 0.25 + Math.random() * 0.25;
            this.particles.push(new Particle(x, y, vx, vy, size, color, life, 'spark'));
        }
    }

    // Effect: Jump dust on surface
    createJumpDust(x, y, isUp) {
        const color = 'rgba(0, 240, 255, 0.8)';
        const dirY = isUp ? 1 : -1;
        for (let i = 0; i < 10; i++) {
            const vx = (Math.random() - 0.5) * 160;
            const vy = dirY * (20 + Math.random() * 60);
            const size = 3 + Math.random() * 3;
            const life = 0.2 + Math.random() * 0.2;
            this.particles.push(new Particle(x + (Math.random() - 0.5) * 20, y, vx, vy, size, color, life, 'circle'));
        }
    }

    // Effect: Coin collected golden explosion
    createCoinSparkle(x, y) {
        const color = '#ffe600';
        this.particles.push(new Particle(x, y, 0, 0, 8, color, 0.3, 'ring'));

        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 160;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = 0.3 + Math.random() * 0.3;
            this.particles.push(new Particle(x, y, vx, vy, 4, color, life, 'spark'));
        }
    }

    // Effect: Death explosion
    createDeathExplosion(x, y) {
        const colors = ['#ff2a55', '#ff007f', '#ffffff', '#ffe600'];
        this.particles.push(new Particle(x, y, 0, 0, 15, '#ff2a55', 0.5, 'ring'));

        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 350;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 3 + Math.random() * 5;
            const life = 0.4 + Math.random() * 0.4;
            const type = Math.random() > 0.5 ? 'square' : 'circle';
            this.particles.push(new Particle(x, y, vx, vy, size, color, life, type));
        }
    }

    // Effect: Checkpoint activated aura
    createCheckpointBurst(x, y) {
        const color = '#00ff66';
        this.particles.push(new Particle(x, y, 0, 0, 12, color, 0.4, 'ring'));
        for (let i = 0; i < 20; i++) {
            const vx = (Math.random() - 0.5) * 80;
            const vy = -60 - Math.random() * 120;
            const life = 0.4 + Math.random() * 0.4;
            this.particles.push(new Particle(x + (Math.random() - 0.5) * 24, y, vx, vy, 4, color, life, 'spark'));
        }
    }

    // Effect: Portal vortex passive emitter
    createPortalVortex(x, y) {
        const colors = ['#00f0ff', '#ff007f', '#9d00ff'];
        const angle = Math.random() * Math.PI * 2;
        const radius = 25 + Math.random() * 15;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        
        // Tangential velocity towards center
        const vx = -Math.cos(angle) * 40 - Math.sin(angle) * 30;
        const vy = -Math.sin(angle) * 40 + Math.cos(angle) * 30;
        const color = colors[Math.floor(Math.random() * colors.length)];

        this.particles.push(new Particle(px, py, vx, vy, 3, color, 0.5, 'circle'));
    }
}
