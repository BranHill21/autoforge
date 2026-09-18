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

## UI & Buttons (Menus)
To create interactive menu buttons, use an `area()` component and the `.onClick()` and `.onHoverUpdate()` methods.
```javascript
const btn = add([
    rect(200, 50),
    pos(center()),
    anchor("center"),
    area(),
    color(255, 255, 255),
]);
btn.add([ text("Start Game", { size: 24 }), anchor("center"), color(0,0,0) ]);

btn.onClick(() => { go("game"); });
btn.onHoverUpdate(() => { btn.color = rgb(200, 200, 200); });
btn.onHoverEnd(() => { btn.color = rgb(255, 255, 255); });
```

## Ad Hooks (Monetization)
Always define global ad functions at the top of your script. Call them when a player dies or when they click a "Watch Ad" button.
```javascript
window.showInterstitialAd = () => { console.log("Ad Placeholder: Interstitial Ad Shown"); };
window.showRewardedAd = (rewardCallback) => { 
    console.log("Ad Placeholder: Rewarded Ad Shown"); 
    if (rewardCallback) rewardCallback();
};
```

## Custom Components & Duplicate Properties
In Kaboom v3000, passing a bare object like `{ radius: 10 }` into `add([])` registers it as a custom component that assigns a `.radius` property to the entity.
**CRITICAL:** If you are also using a built-in component that defines the same property (e.g., `circle(10)` which already defines `.radius`), Kaboom will crash with a "duplicate component property" error. 
Do NOT define properties in a custom component object that share a name with properties provided by built-in components like `rect()` or `circle()`. If you need to store custom data, use distinct names (e.g., `{ elemRadius: 10 }`).

## Custom Drawing & Coordinate Space
When you use `onDraw("tag", (e) => { ... })` or a component's `draw()` method, the drawing context is **relative to the entity's position**.
**CRITICAL:** `pos: vec2(0,0)` inside `drawCircle()` or `drawRect()` will draw exactly at the entity's current location. If you want to draw something at a global coordinate (for example, rendering a trail of previous global positions stored in an array), you MUST subtract the entity's position: `pos: globalPos.sub(e.pos)`. Failure to do this will cause the drawing to be offset by the entity's position twice.
