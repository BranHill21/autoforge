import kaboom from "kaboom";

kaboom({
    width: 800,
    height: 600,
    letterbox: true,
    background: [43, 43, 43],
});

// Ad hooks
window.showInterstitialAd = () => { console.log("Ad Placeholder: Interstitial Ad Shown"); };
window.showRewardedAd = (rewardCallback) => { 
    console.log("Ad Placeholder: Rewarded Ad Shown"); 
    if (rewardCallback) rewardCallback();
};

// Global Game State
const defaultState = {
    score: 0,
    quota: 1000,
    level: 1,
    stability: 100,
    mass: 1,
    upgrades: {
        pullForce: 1,
        maxStability: 100,
        bonusTime: 0,
        pullLevel: 0,
        stabLevel: 0
    },
    money: 0
};
let gameState = getData("sinkhole_save") || JSON.parse(JSON.stringify(defaultState));

function saveGame() {
    setData("sinkhole_save", gameState);
}

// Colors from GDD
const C_GOLD = rgb(227, 197, 101);
const C_GREEN = rgb(90, 107, 92);
const C_DARK = rgb(43, 43, 43);
const C_PINK = rgb(255, 0, 127);
const C_CYAN = rgb(0, 255, 255);

// Scenes
scene("start", () => {
    add([
        rect(800, 600),
        color(C_DARK),
    ]);

    // Grid lines for retro-dystopian feel
    for (let i = 0; i < 800; i += 40) {
        add([
            rect(1, 600),
            pos(i, 0),
            color(C_GREEN),
            opacity(0.1)
        ]);
    }
    for (let i = 0; i < 600; i += 40) {
        add([
            rect(800, 1),
            pos(0, i),
            color(C_GREEN),
            opacity(0.1)
        ]);
    }

    add([
        text("SINKHOLE SYNDICATE", { size: 48, font: "monospace" }),
        pos(400, 120),
        anchor("center"),
        color(C_GOLD),
    ]);

    add([
        text("CORPORATE RETRO-DYSTOPIAN DESTRUCTION", { size: 16, font: "monospace" }),
        pos(400, 170),
        anchor("center"),
        color(C_CYAN),
    ]);

    // Menu buttons
    const makeButton = (textStr, yPos, onClickAction) => {
        const btn = add([
            rect(300, 50, { radius: 4 }),
            pos(400, yPos),
            anchor("center"),
            area(),
            color(C_GREEN),
            outline(2, C_GOLD)
        ]);
        btn.add([
            text(textStr, { size: 20, font: "monospace" }),
            anchor("center"),
            color(C_GOLD)
        ]);
        btn.onClick(onClickAction);
        btn.onHoverUpdate(() => {
            btn.color = C_PINK;
        });
        btn.onHoverEnd(() => {
            btn.color = C_GREEN;
        });
    };

    let btnY = 240;
    
    if (getData("sinkhole_save")) {
        makeButton("CONTINUE SHIFT", btnY, () => {
            go("briefing");
        });
        btnY += 60;
    }

    makeButton("NEW GAME", btnY, () => {
        gameState = JSON.parse(JSON.stringify(defaultState));
        saveGame();
        go("briefing");
    });
    btnY += 60;

    makeButton("BLACK MARKET", btnY, () => {
        go("market");
    });
    btnY += 60;

    makeButton("EMPLOYEE OF THE MONTH", btnY, () => {
        go("credits");
    });

    add([
        text("CONTROLS: Move Mouse = Aim | Hold Left Click = Expand Hole | Right Click = Sonic Burp | Space = Pause", { size: 12, font: "monospace" }),
        pos(400, 550),
        anchor("center"),
        color(C_CYAN)
    ]);
});

scene("briefing", () => {
    add([ rect(800, 600), color(C_DARK) ]);

    add([
        text(`SHIFT ${gameState.level} BRIEFING`, { size: 32, font: "monospace" }),
        pos(400, 80),
        anchor("center"),
        color(C_GOLD)
    ]);

    const memoBox = add([
        rect(600, 300, { radius: 8 }),
        pos(400, 260),
        anchor("center"),
        color(C_GREEN),
        outline(2, C_CYAN)
    ]);

    memoBox.add([
        text(`MEMORANDUM FROM MANAGEMENT:\n\nEmployee, your mandatory destruction quota\nfor this shift is: $${gameState.quota}.\n\nSwallow office equipment, avoid corporate\ndrones, and maximize property damage.\nFailure to meet quota results in termination.\n\nGood luck. Do not look directly into the void.`, { size: 16, font: "monospace" }),
        pos(0, 0),
        anchor("center"),
        color(C_GOLD)
    ]);

    const startBtn = add([
        rect(200, 40, { radius: 4 }),
        pos(400, 480),
        anchor("center"),
        area(),
        color(C_PINK),
    ]);
    startBtn.add([ text("START SHIFT", { size: 18, font: "monospace" }), anchor("center"), color(C_DARK) ]);
    startBtn.onClick(() => {
        go("game");
    });
});

scene("market", () => {
    add([ rect(800, 600), color(C_DARK) ]);

    add([
        text("BLACK MARKET CATALOG", { size: 36, font: "monospace" }),
        pos(400, 80),
        anchor("center"),
        color(C_PINK)
    ]);

    add([
        text(`STOLEN LOOT: $${gameState.money}`, { size: 20, font: "monospace" }),
        pos(400, 130),
        anchor("center"),
        color(C_GOLD)
    ]);

    const createUpgradeItem = (title, cost, maxLevel, currentLevelGetter, onBuy, y) => {
        let currentLvl = currentLevelGetter();
        let displayTitle = currentLvl >= maxLevel ? `${title} (MAX)` : `${title} (Lvl ${currentLvl}/${maxLevel})`;

        const box = add([
            rect(500, 50, { radius: 4 }),
            pos(400, y),
            anchor("center"),
            area(),
            color(C_GREEN),
            outline(1, C_CYAN)
        ]);
        box.add([ text(`${displayTitle} - $${cost}`, { size: 16, font: "monospace" }), pos(-230, -8), color(C_GOLD) ]);
        
        if (currentLvl < maxLevel) {
            const btn = box.add([
                rect(100, 30, { radius: 2 }),
                pos(180, 0),
                anchor("center"),
                area(),
                color(C_PINK)
            ]);
            btn.add([ text("BUY", { size: 14, font: "monospace" }), anchor("center"), color(C_DARK) ]);
            
            btn.onClick(() => {
                if (gameState.money >= cost) {
                    gameState.money -= cost;
                    onBuy();
                    saveGame();
                    go("market");
                }
            });
        }
    };

    createUpgradeItem("Gravitational Pull Booster", 100, 5, () => gameState.upgrades.pullLevel, () => {
        gameState.upgrades.pullForce += 0.5;
        gameState.upgrades.pullLevel++;
    }, 220);

    createUpgradeItem("Stability Energy Tank", 150, 5, () => gameState.upgrades.stabLevel, () => {
        gameState.upgrades.maxStability += 50;
        gameState.upgrades.stabLevel++;
    }, 290);

    const backBtn = add([
        rect(200, 40, { radius: 4 }),
        pos(400, 500),
        anchor("center"),
        area(),
        color(C_GREEN),
    ]);
    backBtn.add([ text("NEXT SHIFT", { size: 18, font: "monospace" }), anchor("center"), color(C_GOLD) ]);
    backBtn.onClick(() => go("briefing"));
});

scene("credits", () => {
    add([ rect(800, 600), color(C_DARK) ]);
    add([ text("EMPLOYEE OF THE MONTH", { size: 32, font: "monospace" }), pos(400, 100), anchor("center"), color(C_GOLD) ]);
    add([ text("Top Destroyer: Boss Hog\nScore: 999,999\n\nYou have a long way to go, drone.", { size: 18, font: "monospace" }), pos(400, 250), anchor("center"), color(C_CYAN) ]);

    const backBtn = add([ rect(200, 40), pos(400, 450), anchor("center"), area(), color(C_GREEN) ]);
    backBtn.add([ text("BACK", { size: 18, font: "monospace" }), anchor("center"), color(C_GOLD) ]);
    backBtn.onClick(() => go("start"));
});

scene("game", () => {
    add([ rect(800, 600), color(C_DARK) ]);

    // Shift clock timer (60 seconds)
    let timeLeft = 60;
    let isPaused = false;
    let inputReady = false;
    let stability = gameState.upgrades.maxStability;
    let maxStability = gameState.upgrades.maxStability;

    wait(0.2, () => inputReady = true);

    // UI Top bar
    const uiBar = add([
        rect(800, 50),
        color(C_GREEN),
        pos(0,0),
        z(100)
    ]);

    const scoreLabel = uiBar.add([ text(`SCORE: $${gameState.score}`, { size: 16, font: "monospace" }), pos(20, 15), color(C_GOLD) ]);
    const quotaLabel = uiBar.add([ text(`QUOTA: $${gameState.quota}`, { size: 16, font: "monospace" }), pos(220, 15), color(C_CYAN) ]);
    const timeLabel = uiBar.add([ text(`TIME: 60s`, { size: 16, font: "monospace" }), pos(440, 15), color(C_PINK) ]);
    const stabLabel = uiBar.add([ text(`STAB: 100%`, { size: 16, font: "monospace" }), pos(600, 15), color(C_GOLD) ]);

    // Sinkhole player entity
    const sinkhole = add([
        pos(400, 300),
        circle(20),
        anchor("center"),
        area(),
        color(C_PINK),
        "sinkhole",
        {
            currentRadius: 20,
            targetRadius: 20,
            massVal: gameState.mass
        }
    ]);

    // Visual event horizon ring
    sinkhole.add([
        circle(25),
        anchor("center"),
        color(C_CYAN),
        opacity(0.4),
        "ring"
    ]);

    // Spawn environment props (office desks, chairs, computers, filing cabinets)
    const props = [];
    const propTypes = [
        { name: "chair", size: 15, value: 50, color: rgb(100, 100, 100) },
        { name: "desk", size: 30, value: 150, color: rgb(120, 80, 40) },
        { name: "computer", size: 10, value: 200, color: C_CYAN },
        { name: "cabinet", size: 40, value: 400, color: rgb(150, 150, 150) },
    ];

    const propCount = 20 + (gameState.level * 5);
    for (let i = 0; i < propCount; i++) {
        const type = propTypes[Math.floor(rand(0, propTypes.length))];
        const p = add([
            pos(rand(100, 700), rand(100, 500)),
            circle(type.size),
            anchor("center"),
            area(),
            body({ mass: type.size }),
            color(type.color),
            outline(1, C_DARK),
            "prop",
            {
                propValue: type.value,
                propSize: type.size
            }
        ]);
        props.push(p);
    }

    // Spawn drones
    const drones = [];
    for (let i = 0; i < 2 + gameState.level; i++) {
        const drone = add([
            pos(rand(100, 700), rand(100, 500)),
            circle(12),
            anchor("center"),
            area(),
            color(C_GOLD),
            outline(2, C_PINK),
            "drone",
            {
                dir: vec2(rand(-1, 1), rand(-1, 1)).unit(),
                speed: 60 + gameState.level * 10
            }
        ]);
        drones.push(drone);
    }

    onUpdate(() => {
        if (isPaused || !inputReady) return;

        // Timer
        timeLeft -= dt();
        timeLabel.text = `TIME: ${Math.max(0, Math.ceil(timeLeft))}s`;

        const activeProps = props.filter(p => p.exists());
        let quotaMet = gameState.score >= gameState.quota;

        if (timeLeft <= 0 || (activeProps.length === 0 && quotaMet)) {
            if (quotaMet) {
                gameState.money += Math.floor(gameState.score / 2);
                gameState.level++;
                gameState.quota += 500;
                gameState.score = 0; // Reset score for next level
                window.showInterstitialAd();
                go("market");
            } else {
                window.showRewardedAd(() => {
                    timeLeft += 20; // Revive bonus time
                });
                // If they don't watch or fail again:
                if (timeLeft <= 0) {
                    go("lose", "TIME OUT!");
                }
            }
        }

        // Move sinkhole to mouse
        const mousePosCoord = mousePos();
        sinkhole.pos = mousePosCoord;

        // Stability & Expand mechanic (Left Click)
        if (isMouseDown("left")) {
            if (stability > 0) {
                stability -= 30 * dt();
                sinkhole.targetRadius = 50 * gameState.upgrades.pullForce;
            } else {
                sinkhole.targetRadius = 20;
            }
        } else {
            if (stability < maxStability) {
                stability += 15 * dt();
            }
            sinkhole.targetRadius = 20;
        }

        stability = Math.max(0, Math.min(maxStability, stability));
        stabLabel.text = `STAB: ${Math.floor((stability / maxStability) * 100)}%`;

        // Smooth radius scaling
        sinkhole.currentRadius = lerp(sinkhole.currentRadius, sinkhole.targetRadius, 0.1);
        sinkhole.radius = sinkhole.currentRadius;

        // Gravitational pull on props
        props.forEach(prop => {
            if (!prop.exists()) return;
            const dist = prop.pos.dist(sinkhole.pos);
            if (dist < 200 * (sinkhole.currentRadius / 20)) {
                const dir = sinkhole.pos.sub(prop.pos).unit();
                const pullPower = (300 * gameState.upgrades.pullForce) / (dist + 10);
                prop.move(dir.scale(pullPower));

                // Consume check
                if (dist < sinkhole.currentRadius + prop.propSize * 0.5) {
                    gameState.score += prop.propValue;
                    scoreLabel.text = `SCORE: $${gameState.score}`;
                    
                    // Floating text
                    add([
                        text(`+$${prop.propValue}`, { size: 14, font: "monospace" }),
                        pos(prop.pos),
                        anchor("center"),
                        color(C_GOLD),
                        lifespan(0.8, { fade: 0.5 }),
                        move(vec2(0, -50), 50)
                    ]);

                    destroy(prop);
                }
            }
        });

        // Sonic Burp (Right Click)
        if (isMousePressed("right")) {
            shake(5);
            props.forEach(prop => {
                if (!prop.exists()) return;
                const dist = prop.pos.dist(sinkhole.pos);
                if (dist < 150) {
                    const dir = prop.pos.sub(sinkhole.pos).unit();
                    prop.move(dir.scale(500));
                }
            });
        }

        // Drone movement
        drones.forEach(d => {
            if (!d.exists()) return;

            d.move(d.dir.scale(d.speed));
            if (d.pos.x < 50 || d.pos.x > 750) d.dir.x *= -1;
            if (d.pos.y < 80 || d.pos.y > 550) d.dir.y *= -1;

            // Drone collision with sinkhole
            if (d.pos.dist(sinkhole.pos) < sinkhole.currentRadius + 12) {
                stability -= 25;
                shake(10);
                destroy(d);
                if (stability <= 0) {
                    go("lose", "STABILITY CRITICAL!"); // Game Over
                }
            }
        });
    });

    onKeyPress("space", () => {
        isPaused = !isPaused;
        if (isPaused) {
            add([
                text("GAME PAUSED", { size: 32, font: "monospace" }),
                pos(400, 300),
                anchor("center"),
                color(C_PINK),
                "pauseText"
            ]);
        } else {
            get("pauseText").forEach(e => destroy(e));
        }
    });
});
scene("lose", (reason) => {
    // Store final stats for display before resetting
    const finalLevel = gameState.level;
    const finalMoney = gameState.money;

    // Rogue-lite mechanic: Wipe the save data on death!
    setData("sinkhole_save", null);
    gameState = JSON.parse(JSON.stringify(defaultState));

    add([ rect(800, 600), color(C_DARK) ]);

    add([
        text("TERMINATED", { size: 48, font: "monospace" }),
        pos(400, 150),
        anchor("center"),
        color(C_PINK)
    ]);

    add([
        text(`Reason: ${reason || "UNKNOWN"}`, { size: 24, font: "monospace" }),
        pos(400, 230),
        anchor("center"),
        color(C_CYAN)
    ]);

    add([
        text(`You reached Shift ${finalLevel}\nand embezzled $${finalMoney}.`, { size: 16, font: "monospace" }),
        pos(400, 320),
        anchor("center"),
        color(C_GOLD)
    ]);

    const btn = add([ rect(200, 50, { radius: 4 }), pos(400, 450), anchor("center"), area(), color(C_GREEN) ]);
    btn.add([ text("MAIN MENU", { size: 18, font: "monospace" }), anchor("center"), color(C_GOLD) ]);
    btn.onClick(() => go("start"));
});

go("start");