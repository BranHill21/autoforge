import kaboom from "kaboom";

kaboom({
    width: 800,
    height: 600,
    letterbox: true,
    background: [10, 10, 15],
});

window.showInterstitialAd = () => { console.log("Ad Placeholder: Interstitial Ad Shown"); };
window.showRewardedAd = (rewardCallback) => { 
    console.log("Ad Placeholder: Rewarded Ad Shown"); 
    if (rewardCallback) rewardCallback();
};

scene("menu", () => {
    add([
        rect(800, 600),
        color(10, 10, 15),
        fixed()
    ]);

    add([
        text("GLYPHSTACK", { size: 52 }),
        pos(400, 150),
        anchor("center"),
        color(0, 255, 200),
        fixed()
    ]);

    add([
        text("Stack glowing glyphs on the swaying pedestal!", { size: 18 }),
        pos(400, 220),
        anchor("center"),
        color(200, 200, 220),
        fixed()
    ]);

    const instructions = [
        "A / D or Scroll: Rotate Glyph",
        "Mouse X: Position Crane",
        "Left Click / Space: Drop Glyph",
        "Right Click: Micro-Nudge Shockwave"
    ];

    instructions.forEach((inst, idx) => {
        add([
            text(inst, { size: 14 }),
            pos(400, 280 + idx * 25),
            anchor("center"),
            color(150, 150, 180),
            fixed()
        ]);
    });

    let inputReady = false;
    wait(0.2, () => { inputReady = true; });

    const btn = add([
        rect(220, 50),
        pos(400, 440),
        anchor("center"),
        area(),
        color(0, 200, 150),
        fixed()
    ]);
    btn.add([ text("START GAME", { size: 20 }), anchor("center"), color(10, 10, 15), fixed() ]);

    btn.onClick(() => {
        if (!inputReady) return;
        go("game", { score: 0, tier: 1 });
    });
    btn.onHoverUpdate(() => { btn.color = rgb(0, 255, 180); });
    btn.onHoverEnd(() => { btn.color = rgb(0, 200, 150); });
});

scene("game", (data) => {
    setGravity(1200);

    let score = data.score || 0;
    let tier = data.tier || 1;
    let consecutiveFails = getData("consecutiveFails") || 0;
    let microNudges = 2;

    const colors = [
        rgb(0, 255, 200), // Cyan
        rgb(255, 0, 128), // Magenta
        rgb(128, 255, 0), // Acid Lime
        rgb(255, 180, 0)  // Amber
    ];

    const shapes = [
        { w: 60, h: 30 },
        { w: 40, h: 40 },
        { w: 80, h: 20 },
        { w: 50, h: 50 },
        { w: 70, h: 25 }
    ];

    // Background stars/dust
    for (let i = 0; i < 40; i++) {
        add([
            circle(rand(1, 2.5)),
            pos(rand(0, 800), rand(0, 600)),
            color(50, 50, 80),
            fixed(),
            z(-10)
        ]);
    }

    // Pedestal
    const pedestalX = 400;
    const pedestalBaseY = 520;
    let pedestalAngle = 0;
    let pedestalTimer = 0;

    const pedestal = add([
        rect(160, 20),
        pos(pedestalX, pedestalBaseY),
        anchor("center"),
        area(),
        body({ isStatic: true }),
        color(40, 40, 60),
        "pedestal"
    ]);
    pedestal.add([
        rect(160, 4),
        pos(0, -10),
        anchor("center"),
        color(0, 255, 200)
    ]);

    // Support pole visual
    add([
        rect(20, 80),
        pos(pedestalX, pedestalBaseY + 50),
        anchor("center"),
        color(30, 30, 45),
        z(-1)
    ]);

    // UI
    const scoreLabel = add([
        text("SCORE: " + score, { size: 20 }),
        pos(24, 24),
        fixed(),
        z(100)
    ]);

    const nudgeLabel = add([
        text("MICRO-NUDGES: " + microNudges + " (Right Click)", { size: 14 }),
        pos(24, 55),
        fixed(),
        z(100)
    ]);

    const tierLabel = add([
        text("TIER: " + tier, { size: 16 }),
        pos(776, 24),
        anchor("topright"),
        fixed(),
        z(100)
    ]);

    let inputReady = false;
    wait(0.2, () => { inputReady = true; });

    let currentGlyph = null;
    let craneX = 400;
    let craneAngle = 0;
    let isSpawning = false;
    let isGameOver = false;

    function spawnGlyph() {
        if (isGameOver) return;
        isSpawning = true;
        const shapeDef = shapes[Math.floor(rand(0, shapes.length))];
        const col = colors[Math.floor(rand(0, colors.length))];

        currentGlyph = add([
            rect(shapeDef.w, shapeDef.h),
            pos(craneX, 100),
            anchor("center"),
            area(),
            body({ mass: 2 }),
            rotate(0),
            color(col),
            "glyph",
            { isDropped: false, blockColor: col }
        ]);

        currentGlyph.add([
            rect(shapeDef.w - 8, shapeDef.h - 8),
            pos(0, 0),
            anchor("center"),
            color(10, 10, 15)
        ]);

        currentGlyph.add([
            text(String.fromCharCode(65 + Math.floor(rand(0, 26))), { size: 14 }),
            pos(0, 0),
            anchor("center"),
            color(col)
        ]);
        isSpawning = false;
    }

    spawnGlyph();

    onMousePress("right", () => {
        if (!inputReady || microNudges <= 0 || isGameOver) return;
        microNudges--;
        nudgeLabel.text = "MICRO-NUDGES: " + microNudges + " (Right Click)";

        // Shockwave pulse
        add([
            circle(10),
            pos(pedestalX, pedestalBaseY),
            anchor("center"),
            color(0, 255, 200),
            opacity(0.8),
            lifespan(0.4, { fade: 0.1 }),
            scale(1),
            {
                update() {
                    this.scale = this.scale.add(vec2(dt() * 15, dt() * 15));
                }
            }
        ]);

        get("glyph").forEach(g => {
            if (g.exists() && g.isDropped) {
                if (typeof g.applyImpulse === "function") {
                    g.applyImpulse(vec2(rand(-150, 150), -300));
                } else if (typeof g.addForce === "function") {
                    g.addForce(vec2(rand(-150, 150), -3000));
                }
            }
        });
    });

    onUpdate(() => {
        if (!inputReady || isGameOver) return;

        // Pedestal sway escalation
        pedestalTimer += dt() * (1 + tier * 0.2);
        const swayFreq = 1.5 + tier * 0.3;
        const swayAmp = 15 + tier * 8;
        pedestalAngle = Math.sin(pedestalTimer * swayFreq) * swayAmp;
        pedestal.angle = pedestalAngle;

        // Wind gusts at higher tiers
        if (tier >= 2) {
            const wind = Math.sin(time() * 2) * (tier * 25);
            get("glyph").forEach(g => {
                if (g.exists() && g.isDropped) {
                    if (typeof g.addForce === "function") {
                        g.addForce(vec2(wind, 0));
                    }
                }
            });
        }

        // Crane movement
        const mPos = mousePos();
        craneX = clamp(mPos.x, 100, 700);

        if (currentGlyph && !currentGlyph.isDropped && currentGlyph.exists()) {
            craneAngle += (craneX - currentGlyph.pos.x) * 0.05;
            craneAngle = clamp(craneAngle, -30, 30);
            craneAngle *= 0.9; // damp

            currentGlyph.pos.x = craneX + Math.sin(time() * 4) * 20;
            currentGlyph.pos.y = 100 + Math.cos(time() * 2) * 5;
            currentGlyph.angle = craneAngle;

            if (isKeyDown("a") || isKeyDown("left")) currentGlyph.angle -= 90 * dt();
            if (isKeyDown("d") || isKeyDown("right")) currentGlyph.angle += 90 * dt();
        }
    });

    onScroll((delta) => {
        if (currentGlyph && !currentGlyph.isDropped && currentGlyph.exists()) {
            currentGlyph.angle += delta.y * 0.2;
        }
    });

    onMousePress("left", () => {
        dropGlyph();
    });

    onKeyPress("space", () => {
        dropGlyph();
    });

    function dropGlyph() {
        if (!inputReady || !currentGlyph || currentGlyph.isDropped || !currentGlyph.exists() || isSpawning || isGameOver) return;

        currentGlyph.isDropped = true;
        score += 10 * tier;
        scoreLabel.text = "SCORE: " + score;

        // Particle burst
        for (let i = 0; i < 8; i++) {
            add([
                circle(rand(2, 4)),
                pos(currentGlyph.pos),
                anchor("center"),
                color(currentGlyph.blockColor),
                move(rand(0, 360), rand(50, 150)),
                lifespan(0.4, { fade: 0.2 }),
                scale(1),
                {
                    update() {
                        this.scale = this.scale.sub(vec2(dt() * 2, dt() * 2));
                    }
                }
            ]);
        }

        wait(1.0, () => {
            if (!isGameOver) {
                spawnGlyph();
            }
        });
    }

    // Check bounds & game over conditions
    onUpdate(() => {
        if (isGameOver) return;
        
        get("glyph").forEach(g => {
            if (!g.exists()) return;

            // Fall off screen
            if (g.pos.y > 650 || g.pos.x < -100 || g.pos.x > 900) {
                if (g.isDropped) {
                    destroy(g);
                    triggerGameOver();
                } else {
                    destroy(g);
                }
            }

            // Tower height progression check
            if (g.isDropped && g.pos.y < 350 && tier === 1) {
                tier = 2;
                tierLabel.text = "TIER: 2";
            }
            if (g.isDropped && g.pos.y < 200 && tier === 2) {
                tier = 3;
                tierLabel.text = "TIER: 3";
            }
        });
    });

    function triggerGameOver() {
        if (isGameOver) return;
        isGameOver = true;

        consecutiveFails++;
        setData("consecutiveFails", consecutiveFails);

        if (consecutiveFails >= 3) {
            window.showInterstitialAd();
            setData("consecutiveFails", 0);
        }

        go("gameover", { score: score });
    }
});

scene("gameover", (data) => {
    add([
        rect(800, 600),
        color(10, 10, 15),
        fixed()
    ]);

    add([
        text("TOWER COLLAPSED", { size: 40 }),
        pos(400, 180),
        anchor("center"),
        color(255, 50, 100),
        fixed()
    ]);

    add([
        text("Final Score: " + data.score, { size: 24 }),
        pos(400, 250),
        anchor("center"),
        color(200, 200, 220),
        fixed()
    ]);

    let inputReady = false;
    wait(0.3, () => { inputReady = true; });

    const retryBtn = add([
        rect(220, 50),
        pos(400, 360),
        anchor("center"),
        area(),
        color(0, 200, 150),
        fixed()
    ]);
    retryBtn.add([ text("RETRY", { size: 20 }), anchor("center"), color(10, 10, 15), fixed() ]);

    retryBtn.onClick(() => {
        if (!inputReady) return;
        go("game", { score: 0, tier: 1 });
    });

    const reviveBtn = add([
        rect(220, 50),
        pos(400, 430),
        anchor("center"),
        area(),
        color(150, 0, 200),
        fixed()
    ]);
    reviveBtn.add([ text("WATCH AD TO REVIVE", { size: 16 }), anchor("center"), color(255, 255, 255), fixed() ]);

    reviveBtn.onClick(() => {
        if (!inputReady) return;
        window.showRewardedAd(() => {
            go("game", { score: data.score, tier: 1 });
        });
    });

    const menuBtn = add([
        rect(220, 40),
        pos(400, 500),
        anchor("center"),
        area(),
        color(50, 50, 70),
        fixed()
    ]);
    menuBtn.add([ text("MAIN MENU", { size: 16 }), anchor("center"), color(200, 200, 200), fixed() ]);

    menuBtn.onClick(() => {
        if (!inputReady) return;
        go("menu");
    });
});

go("menu");