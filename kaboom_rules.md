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
- **CRITICAL:** Do NOT use the `solid()` component (it is deprecated and will crash). Instead, to make an immovable physical object (like a floor or wall), use `area()` combined with `body({ isStatic: true })`.

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
- **CRITICAL:** Do NOT use `.overlaps()`. It is deprecated. To check collision manually in an update loop, use `.isColliding(other)`.
- **CRITICAL:** Do NOT use `keyPress()` or `mouseClick()`. They are deprecated. Use `onKeyPress()` and `onMousePress()` or `onClick()`.

## State & Game Logic Rules
- **Array Management:** When keeping arrays of entities (e.g. `const enemies = []`), always check `if (!e.exists()) return;` inside your custom `onUpdate` loops because calling `destroy(e)` does NOT remove it from your custom array.
- **Input Carryover:** Input states like `isMouseDown()` or `isKeyPressed()` can bleed across `go("scene")` transitions. Always add a small delay before accepting continuous input in a new scene (e.g. `let inputReady = false; wait(0.1, () => inputReady = true);` and check `!inputReady`).
- **Win/Loss Conditions:** Always check for early win/loss conditions (e.g., all enemies dead, or player health <= 0) rather than relying strictly on timers. Use `.filter(e => e.exists())` to count remaining active entities in custom arrays.

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

## Visual Effects & Occlusion
When creating visual effects (like glows, auras, or trails) that are drawn behind or exactly on top of a solid entity, **you must ensure the effect is drawn larger than the entity itself**. If the effect's radius/size is equal to or smaller than the solid core, it will be completely hidden by the solid core and the user will not see it. Always add a padding offset (e.g., `radius: e.radius + 10`) to visual effects so they peek out from the edges.

## Z-Index Layering
To control the drawing order of entities, use the `z()` component. **DO NOT** use `zIndex()`—that is a CSS property and it does not exist in Kaboom. If you use `zIndex(100)`, the game will crash with a ReferenceError. Always use `z(100)` instead.

## Save Data & Local Storage
- **CRITICAL:** Do NOT use the browser's native `localStorage.setItem()` or `getItem()`. Instead, Kaboom v3000 provides built-in `setData("key", value)` and `getData("key")` which safely handle JSON serialization automatically.
- Example: `setData("save", { score: 100 }); let mySave = getData("save");`

## Progression & Scene Routing
- **CRITICAL:** When designing games with shops or between-level menus, NEVER route the "Back" or "Exit" button back to the Main Menu (which typically resets game state). Always provide a "Next Level" or "Continue" button that calls `go("game")` or the next scene to preserve state and level progression.

## Deprecated Syntax (v2000 vs v3000)
- Do NOT use `addLevel()`. It is highly likely you will hallucinate the v2000 syntax. Generate levels manually or use standard object spawning loops.
- Do NOT use `camScale(2)`. In v3000, it requires a vector: `camScale(vec2(2, 2))`.
- Do NOT use `body().resolve()`. Physics resolution is handled automatically under the hood in v3000.

## Best Practices for High-Quality Generation
To ensure the generated game is polished, optimized, and bug-free:
1. **Memory Leaks:** Always attach `offscreen({ destroy: true })` or `lifespan(5)` to projectiles, spawned enemies, or particle effects. Failure to do so will cause the game to lag heavily after 60 seconds as thousands of objects pile up off-screen.
2. **Frame-Rate Independence:** ALWAYS use `dt()` for timers, cooldowns, and movement (e.g., `time -= dt()`, `move(dir.scale(speed * dt()))`). Never use `time -= 1` as this will cause the game to run twice as fast on 120Hz monitors compared to 60Hz monitors.
3. **Collision Tags:** For `.onCollide("tag")` to work, the target entity MUST have `"tag"` as a bare string in its `add([...])` array. Double-check that all enemies, bullets, and players have explicit string tags.
4. **UI Layering:** Always assign `z(100)` or higher to UI text and HUD elements so they are never accidentally covered by game entities or particle effects.
5. **State Initialization:** Always reset global gameplay variables (like `score = 0; health = 100;`) explicitly at the start of the `game` scene or when clicking the "New Game" button. Do not rely on their initial declaration values, as they will not reset upon a Game Over.

## Game Design & Difficulty Scaling
When designing games that scale infinitely across levels or time, follow these core design principles:
1. **Multi-Faceted Scaling:** Do not *just* increase the number of enemies. Introduce entirely new challenges at certain thresholds (e.g., at Level 3, introduce a new drone type that moves in curves, circles, or homes in on the player; at Level 5, add indestructible moving obstacles). Note: Avoid complex collision environments if relying heavily on mouse-following physics.
2. **Pressure Scaling:** Gently decrease the time limit, increase enemy speeds, or reduce the size of collectible items as levels progress until they reach a minimum playable threshold. 
3. **Achievable Master Goals:** Games should be infinitely replayable, but they should also have at least one explicit "achievable goal" for the player to strive for (e.g., unlocking all upgrades, reaching a specific "Employee of the Month" quota, or defeating a rare Level 10 boss). This gives the session a satisfying arc while allowing endless play afterward.
4. **Game Over / Defeat Screens:** NEVER route a player directly back to the "Start" menu or main menu upon death or failing a level. Always create a dedicated `scene("lose")` or `scene("gameover")` that displays their final score/level, a "Game Over" message, and a button to return to the main menu. 
    - *Genre Specific (Rogue-lites/Permadeath):* If the game is a rogue-lite or arcade game, ensure you wipe the player's save data (`setData("save", null)`) upon death so they lose their progress and are forced to start back at Level 1, encouraging replayability. Do NOT do this for puzzle or story games with check-points.
    - *Stat Capture:* When resetting global state on a Game Over screen, ensure you capture and save the final score/level to local constants FIRST so the death screen displays their actual final stats, not the reset zeroes.
## Critical Engine Quirks & Vector Math
Generative AI frequently makes the following syntax errors in Javascript/Kaboom. Review these carefully:
1. **Vector Math Operators:** JavaScript does NOT support operator overloading. You cannot add vectors with `+`. Doing `pos + vec2(10, 0)` will convert them to strings and crash the game. You MUST use vector methods: `pos = pos.add(vec2(10, 0))`, `vel = vel.scale(2)`, or `pos.x += 10`.
2. **Function vs Property (Mouse & Camera):** `mousePos()` and `camPos()` are **functions**, not properties. Do NOT write `mousePos.x` or `camPos.y` (this will return undefined and crash). Always use `mousePos().x` and `camPos().y`.
3. **Color Component Syntax:** The `color()` component expects RGB values. Do NOT pass hex strings like `color("#FF0000")`. Always use `color(255, 0, 0)` or `color(rgb(255, 0, 0))`.
4. **Text Component Syntax:** The `text()` component takes an options object for its second argument. Do NOT write `text("Score", 24)`. You must write `text("Score", { size: 24 })`.

## UI & Camera Movement (The `fixed()` Component)
If your game involves the camera moving (e.g., `camPos(player.pos)`), any UI elements (like score text, health bars, or static HUDs) will scroll off the screen. 
- **CRITICAL:** You MUST add the `fixed()` component to all HUD and UI elements so they ignore camera movement and remain locked to the screen coordinates.
- Remember to also apply `z(100)` to these `fixed()` UI elements.
