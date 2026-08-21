# 🌀 Gravity Flip

> A fast-paced 2D platformer browser game built with vanilla HTML5 Canvas, CSS3, and JavaScript, where the core mechanic is dynamically reversing gravity!

![Gravity Flip Game](https://img.shields.org/badge/Game-Playable-brightgreen) ![HTML5](https://img.shields.org/badge/HTML5-Canvas-orange) ![JavaScript](https://img.shields.org/badge/JavaScript-ES6+-yellow)

---

## 🎮 Gameplay & Features

- **Dynamic Gravity Reversal:** Press `SHIFT` to invert physics between **DOWN** and **UP**. The player smoothly rotates 180° and runs upside down on ceiling platforms!
- **Fluid Movement & Physics:** AABB collision detection, coyote time buffer, moving platforms, and disappearing platforms.
- **Level Design:** 5 multi-section areas featuring ceiling runs, spike hazards, laser beams, 15 energy orb collectibles, 3 checkpoints, and an Exit Portal.
- **Procedural Sound Engine:** Custom Web Audio API synthesizer for retro sound effects (jumps, gravity flips, coin pickups, hazard deaths, checkpoint chimes, and victory fanfare).
- **Cyberpunk Aesthetics:** Futuristic glowing HUD, particle shockwaves, camera screen shake, and responsive screen screens (Start, How to Play, Pause, Game Over, Level Completed).

---

## 🕹️ Controls

| Key | Action |
| :--- | :--- |
| <kbd>A</kbd> / <kbd>D</kbd> or <kbd>◄</kbd> <kbd>►</kbd> | Move Left / Right |
| <kbd>SPACE</kbd> or <kbd>W</kbd> | Jump |
| <kbd>SHIFT</kbd> or <kbd>S</kbd> | **FLIP GRAVITY** (Invert physics) |
| <kbd>R</kbd> | Restart level / Respawn at checkpoint |
| <kbd>ESC</kbd> or <kbd>P</kbd> | Pause Game |

---

## 🚀 Quick Start (Local Setup)

No dependencies or build steps required! Simply clone the repository and open `index.html` in any web browser:

```bash
git clone https://github.com/Mangasamudramkumar/gravity-flip.git
cd gravity-flip
```

Open `index.html` directly in Chrome, Edge, Firefox, or Safari!

---

## 📁 Repository Structure

```
gravity-flip/
├── index.html        # Main HTML container & UI overlays
├── style.css         # Cyberpunk styling & UI layout
├── js/
│   ├── audio.js      # Web Audio API procedural synthesizer
│   ├── particles.js  # Visual particle effects system
│   ├── physics.js    # Collision detection & gravity math
│   ├── level.js      # Platforms, hazards, coins, & exit portal
│   ├── player.js     # Robot avatar renderer & state
│   ├── camera.js     # Smooth tracking camera & screen shake
│   └── game.js       # Main game loop & state manager
└── README.md
```
