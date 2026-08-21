// Physics Engine & Collision Detection for Gravity Flip

function rectIntersect(r1, r2) {
    return !(
        r2.x >= r1.x + r1.w ||
        r2.x + r2.w <= r1.x ||
        r2.y >= r1.y + r1.h ||
        r2.y + r2.h <= r1.y
    );
}

class PhysicsEngine {
    constructor() {
        this.gravityMagnitude = 1650; // px/s^2
        this.maxFallSpeed = 680;
        this.horizontalAccel = 2200;
        this.horizontalFriction = 1800;
        this.maxSpeed = 340;
        this.jumpImpulse = 540; // upward jump magnitude
    }

    updatePlayer(player, level, dt, particleSystem, audioEngine) {
        // 1. Horizontal movement handling
        if (player.inputDir !== 0) {
            player.vx += player.inputDir * this.horizontalAccel * dt;
            player.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, player.vx));
            player.facing = player.inputDir;
        } else {
            // Apply friction/deceleration
            if (player.vx > 0) {
                player.vx = Math.max(0, player.vx - this.horizontalFriction * dt);
            } else if (player.vx < 0) {
                player.vx = Math.min(0, player.vx + this.horizontalFriction * dt);
            }
        }

        // 2. Vertical gravity application
        const currentGravity = this.gravityMagnitude * player.gravityDir;
        player.vy += currentGravity * dt;
        
        // Clamp vertical fall speed
        if (player.gravityDir > 0) {
            player.vy = Math.min(this.maxFallSpeed, Math.max(-this.maxFallSpeed, player.vy));
        } else {
            player.vy = Math.max(-this.maxFallSpeed, Math.min(this.maxFallSpeed, player.vy));
        }

        // 3. Coyote time update
        if (player.isGrounded) {
            player.coyoteTimer = 0.15; // 0.15 seconds jump grace window
        } else {
            player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
        }

        // Reset grounded state before collision checks
        player.isGrounded = false;
        let activePlatform = null;

        // 4. Perform X Axis movement & collision
        player.x += player.vx * dt;
        let playerBox = player.getBounds();

        for (const platform of level.platforms) {
            if (!platform.solid || !platform.active) continue;
            const pBox = { x: platform.x, y: platform.y, w: platform.w, h: platform.h };

            if (rectIntersect(playerBox, pBox)) {
                if (player.vx > 0) {
                    player.x = platform.x - player.w;
                    player.vx = 0;
                } else if (player.vx < 0) {
                    player.x = platform.x + platform.w;
                    player.vx = 0;
                }
                playerBox = player.getBounds();
            }
        }

        // 5. Perform Y Axis movement & collision
        player.y += player.vy * dt;
        playerBox = player.getBounds();

        for (const platform of level.platforms) {
            if (!platform.solid || !platform.active) continue;
            const pBox = { x: platform.x, y: platform.y, w: platform.w, h: platform.h };

            if (rectIntersect(playerBox, pBox)) {
                // NORMAL GRAVITY (gravityDir = 1, falling downwards)
                if (player.gravityDir > 0) {
                    if (player.vy > 0 && player.y + player.h - player.vy * dt <= platform.y + 10) {
                        // Landed on top of platform
                        player.y = platform.y - player.h;
                        player.vy = 0;
                        player.isGrounded = true;
                        activePlatform = platform;
                    } else if (player.vy < 0) {
                        // Head hit bottom of platform
                        player.y = platform.y + platform.h;
                        player.vy = 0;
                    }
                } 
                // REVERSED GRAVITY (gravityDir = -1, falling upwards)
                else {
                    if (player.vy < 0 && player.y - player.vy * dt >= platform.y + platform.h - 10) {
                        // Attached to ceiling of platform
                        player.y = platform.y + platform.h;
                        player.vy = 0;
                        player.isGrounded = true;
                        activePlatform = platform;
                    } else if (player.vy > 0) {
                        // Feet hit top of platform while falling downward in reverse mode
                        player.y = platform.y - player.h;
                        player.vy = 0;
                    }
                }
                playerBox = player.getBounds();
            }
        }

        // 6. Handle platform special properties (Moving & Disappearing)
        if (activePlatform) {
            // Disappearing platform trigger
            if (activePlatform.type === 'disappearing' && !activePlatform.triggered) {
                activePlatform.triggered = true;
                activePlatform.timer = 0.35; // 0.35s to vanish
            }

            // Moving platform velocity transfer
            if (activePlatform.type === 'moving') {
                player.x += activePlatform.dx;
                player.y += activePlatform.dy;
            }
        }

        // 7. World boundaries check
        if (player.x < 0) {
            player.x = 0;
            player.vx = 0;
        } else if (player.x > level.width - player.w) {
            player.x = level.width - player.w;
            player.vx = 0;
        }

        // Fell off bottom/top map pit
        if (player.y > level.height + 100 || player.y < -150) {
            player.kill('pit', particleSystem, audioEngine);
        }
    }

    executeJump(player, particleSystem, audioEngine) {
        // Jump is valid if grounded OR within coyote time
        if (player.isGrounded || player.coyoteTimer > 0) {
            // Velocity direction depends on gravity mode
            player.vy = -this.jumpImpulse * player.gravityDir;
            player.isGrounded = false;
            player.coyoteTimer = 0;

            const dustY = player.gravityDir > 0 ? player.y + player.h : player.y;
            particleSystem.createJumpDust(player.x + player.w / 2, dustY, player.gravityDir < 0);
            audioEngine.playJump();
            return true;
        }
        return false;
    }

    executeGravityFlip(player, particleSystem, audioEngine) {
        const now = performance.now();
        if (now - player.lastFlipTime < 180) return false; // 180ms cooldown to prevent double taps

        player.gravityDir *= -1;
        player.lastFlipTime = now;
        player.isGrounded = false;
        player.coyoteTimer = 0;

        particleSystem.createGravityFlipBurst(player.x + player.w / 2, player.y + player.h / 2, player.gravityDir < 0);
        audioEngine.playGravityFlip(player.gravityDir < 0);
        return true;
    }
}
