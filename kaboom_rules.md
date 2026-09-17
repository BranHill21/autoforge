# Kaboom.js v3000 Cheat Sheet & Rules

CRITICAL: You are generating code for Kaboom.js v3000. DO NOT use syntax from v2000 or older (e.g. do not use `addText()`, `origin()`, or `input.isKeyDown()`).

## Initialization
```javascript
import kaboom from "kaboom";
kaboom({
    width: 1280,
    height: 720,
    letterbox: true, // IMPORTANT for scaling
    background: [0, 0, 0],
});
```

## Adding Objects
- Use `add([])` with an array of components.
- Components include: `sprite()`, `rect()`, `circle()`, `text()`, `pos()`, `anchor()`, `area()`, `body()`, `color()`, `move()`, `lifespan()`, `state()`.

```javascript
const player = add([
    rect(32, 32),
    pos(center()),
    anchor("center"), // Replaces old origin()
    color(255, 0, 0),
    area(),
    body(),
    "player" // Tags are just strings
]);
```

## Text
- Do NOT use `addText()`. Use `text()` component inside `add()`.
```javascript
const scoreLabel = add([
    text("Score: 0", { size: 32 }),
    pos(24, 24)
]);
// update text
scoreLabel.text = "Score: 10";
```

## Input (Keyboard & Mouse)
- Do NOT use `input.` namespace. Functions are global in v3000.
```javascript
// Events
onKeyPress("space", () => { player.jump(600); });
onKeyDown("left", () => { player.move(-300, 0); });
onClick(() => { player.jump(600); });

// State checking
if (isKeyDown("right")) { player.move(300, 0); }
if (isMousePressed()) { player.jump(600); }
```

## Physics & Movement
- Use `setGravity(1600)` to set global gravity (do not pass it into `body({gravity: 1600})`).
- Check if grounded: `player.isGrounded()`.
- Move: `player.move(vx, vy)`.
- Jump: `player.jump(power)`.

## Loading Assets (Sprites & Audio)
Load images directly from raw CDNs or Data URIs.
```javascript
loadSprite("bean", "https://kaboomjs.com/sprites/bean.png");
// Audio
loadSound("jump", "https://kaboomjs.com/sounds/jump.mp3");
play("jump");
```

> **CRITICAL ASSET RULE:** If you are not 100% certain of a valid image URL, DO NOT guess. A 404 error will crash the game. Instead, use emojis in a `text()` component or use colored `rect()`/`circle()` components to represent characters and items.

## Scenes
- Define scenes with `scene("name", () => {})` and switch with `go("name")`.

## Game Loop & Events
```javascript
onUpdate(() => { /* runs every frame */ });
player.onUpdate(() => { /* runs every frame for this object */ });
player.onCollide("enemy", (e, col) => { /* Collision handling */ });
wait(2, () => { /* timeout */ });
loop(1, () => { /* interval */ });
```
