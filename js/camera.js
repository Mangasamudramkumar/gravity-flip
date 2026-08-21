// Camera Controller with Lerp & Screen Shake

class Camera {
    constructor(viewportWidth, viewportHeight) {
        this.vw = viewportWidth;
        this.vh = viewportHeight;
        this.x = 0;
        this.y = 0;
        this.lerpSpeed = 8; // Smoothing factor

        // Screen Shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeX = 0;
        this.shakeY = 0;
    }

    triggerShake(intensity = 10, duration = 0.3) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    update(dt, player, level) {
        // Target horizontal position centered on player
        const targetX = player.x + player.w / 2 - this.vw / 2;
        this.x += (targetX - this.x) * this.lerpSpeed * dt;

        // Clamp camera X within level boundaries
        this.x = Math.max(0, Math.min(level.width - this.vw, this.x));

        // Fixed Y centered view (0 to level.height - viewportHeight)
        const targetY = player.y + player.h / 2 - this.vh / 2;
        this.y += (targetY - this.y) * (this.lerpSpeed * 0.5) * dt;
        this.y = Math.max(0, Math.min(level.height - this.vh, this.y));

        // Handle Screen Shake timer
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            if (this.shakeDuration <= 0) {
                this.shakeX = 0;
                this.shakeY = 0;
            }
        }
    }
}
