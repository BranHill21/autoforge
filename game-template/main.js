import kaboom from "kaboom";

kaboom({
    width: 1280,
    height: 720,
    letterbox: true,
    background: [10, 10, 18],
});

window.showInterstitialAd = () => { console.log("Ad Placeholder: Interstitial Ad Shown"); };
window.showRewardedAd = (rewardCallback) => { 
    console.log("Ad Placeholder: Rewarded Ad Shown"); 
    if (rewardCallback) rewardCallback();
};

scene("menu", () => {
    add([
        rect(1280, 720),
        color(10, 10, 18),
    ]);

    // Grid lines for neon wireframe look
    for(let i=0; i<1280; i+=80) {
        add([rect(1, 720), pos(i, 0), color(0, 255, 255), opacity(0.05)]);
    }
    for(let j=0; j<720; j+=80) {
        add([rect(1280, 1), pos(0, j), color(0, 255, 255), opacity(0.05)]);
    }

    add([
        text("TEMPORAL COURIER", { size: 64 }),
        pos(center().x, 150),
        anchor("center"),
        color(0, 255, 255),
    ]);

    add([
        text("Draw splines. Deliver packages. Leave Echoes behind.", { size: 24 }),
        pos(center().x, 230),
        anchor("center"),
        color(255, 0, 128),
    ]);

    // Instructions Box
    let instBox = add([
        rect(800, 260, { radius: 8 }),
        pos(center().x, 420),
        anchor("center"),
        color(20, 20, 35),
        area(),
        outline(2, rgb(0, 255, 255))
    ]);

    instBox.add([
        text(
            "RULES OF OPERATION:\n\n" +
            "1. 15-second loop: Analyze hazards & draw path with Mouse (hold & drag).\n" +
            "2. Courier executes path. Avoid lasers & turrets.\n" +
            "3. Death / Spacebar: Bakes run into a solid Echo.\n" +
            "4. Use Echoes as stepping stones and weight-triggers.\n" +
            "5. Reach the green Portal before shifts collapse!",
            { size: 18, width: 760 }
        ),
        pos(0, 0),
        anchor("center"),
        color(200, 200, 220)
    ]);

    let startBtn = add([
        rect(240, 60, { radius: 6 }),
        pos(center().x, 620),
        anchor("center"),
        color(0, 255, 128),
        area(),
    ]);
    startBtn.add([text("INITIATE SHIFT", { size: 22 }), anchor("center"), color(0, 0, 0)]);

    let inputReady = false;
    wait(0.2, () => { inputReady = true; });

    startBtn.onClick(() => {
        if (!inputReady) return;
        go("game", { sector: 1, echoes: [] });
    });
});

scene("game", (data) => {
    let sector = data.sector || 1;
    let echoesData = data.echoes || [];
    let fails = data.fails || 0;

    setGravity(0);

    // Background aesthetic
    add([rect(1280, 720), color(12, 12, 22)]);
    for(let i=0; i<1280; i+=100) add([rect(1, 720), pos(i,0), color(0, 255, 255), opacity(0.03)]);
    for(let j=0; j<720; j+=100) add([rect(1280, 1), pos(0,j), color(0, 255, 255), opacity(0.03)]);

    // HUD Elements
    let sectorLabel = add([text(`SECTOR: ${sector}`, { size: 24 }), pos(30, 20), fixed(), z(100), color(0, 255, 255)]);
    let timerLabel = add([text("TIME: 15.0s", { size: 24 }), pos(300, 20), fixed(), z(100), color(255, 180, 0)]);
    let phaseLabel = add([text("PHASE: DRAW PATH", { size: 24 }), pos(600, 20), fixed(), z(100), color(255, 0, 128)]);
    
    add([text("[SPACE] Bake Echo & Reset | [R] Instant Reset", { size: 16 }), pos(30, 680), fixed(), z(100), color(100, 100, 140)]);

    let startPos = vec2(100, 360);
    let portalPos = vec2(1180, 360);

    let hazards = [];
    let switches = [];
    let doors = [];

    if (sector >= 1) {
        hazards.push({ pos: vec2(500, 150), size: vec2(40, 300), speed: 120, dir: 1, range: 200 });
        hazards.push({ pos: vec2(800, 300), size: vec2(40, 300), speed: 150, dir: -1, range: 200 });
    }
    if (sector >= 5) {
        hazards.push({ pos: vec2(300, 500), size: vec2(300, 40), speed: 100, dir: 1, range: 250 });
    }
    if (sector >= 10) {
        switches.push({ pos: vec2(640, 620), pressed: false, id: 1 });
        doors.push({ pos: vec2(640, 360), size: vec2(40, 200), open: false, id: 1 });
    }

    let hazardObjs = [];
    hazards.forEach(h => {
        let hz = add([
            rect(h.size.x, h.size.y, { radius: 4 }),
            pos(h.pos),
            anchor("center"),
            color(255, 100, 0),
            area(),
            "hazard",
            { hConfig: h, startY: h.pos.y, startX: h.pos.x }
        ]);
        hazardObjs.push(hz);
    });

    let doorObjs = [];
    doors.forEach(d => {
        let dz = add([
            rect(d.size.x, d.size.y),
            pos(d.pos),
            anchor("center"),
            color(0, 200, 255),
            area(),
            body({ isStatic: true }),
            "door",
            { dConfig: d }
        ]);
        doorObjs.push(dz);
    });

    let switchObjs = [];
    switches.forEach(s => {
        let sz = add([
            rect(50, 20),
            pos(s.pos),
            anchor("center"),
            color(255, 255, 0),
            area(),
            "switch",
            { sConfig: s }
        ]);
        switchObjs.push(sz);
    });

    let portal = add([
        rect(50, 90, { radius: 8 }),
        pos(portalPos),
        anchor("center"),
        color(0, 255, 128),
        area(),
        outline(3, rgb(255, 255, 255)),
        "portal"
    ]);
    portal.add([text("GATE", { size: 14 }), anchor("center"), color(0,0,0)]);

    // Spawn Past Echoes with physical mass
    let echoNodes = [];
    echoesData.forEach((ed, idx) => {
        let echoNode = add([
            rect(24, 24, { radius: 12 }),
            pos(ed.path[0] || startPos),
            anchor("center"),
            color(255, 0, 128),
            area(),
            body({ isStatic: true }),
            z(10),
            "echo"
        ]);
        echoNode.add([text(`#${idx+1}`, { size: 10 }), anchor("center"), color(255, 255, 255)]);

        echoNodes.push({ node: echoNode, data: ed, pathIdx: 0, pTimer: 0 });
    });

    let courier = add([
        circle(12),
        pos(startPos),
        anchor("center"),
        color(0, 255, 255),
        area(),
        z(20),
        "courier"
    ]);

    let gameState = "DRAWING";
    let timeLeft = 15.0;
    let drawnPath = [startPos];
    let executionIndex = 0;
    let executionTimer = 0;

    // Use mouse down & mouse move for smooth spline drawing
    onMouseDown(() => {
        if (gameState !== "DRAWING") return;
        let mPos = mousePos();
        let lastPt = drawnPath[drawnPath.length - 1];
        if (mPos.dist(lastPt) > 8 && drawnPath.length < 250) {
            drawnPath.push(mPos);
        }
    });

    // Also support continuous drawing while holding mouse button down
    onUpdate(() => {
        if (gameState === "DRAWING" && isMouseDown()) {
            let mPos = mousePos();
            let lastPt = drawnPath[drawnPath.length - 1];
            if (mPos.dist(lastPt) > 8 && drawnPath.length < 250) {
                drawnPath.push(mPos);
            }
        }
    });

    onDraw(() => {
        if (gameState === "DRAWING" && drawnPath.length > 1) {
            for (let i = 0; i < drawnPath.length - 1; i++) {
                drawLine({
                    p1: drawnPath[i],
                    p2: drawnPath[i+1],
                    width: 3,
                    color: rgb(0, 255, 255),
                });
            }
        }
    });

    onUpdate(() => {
        if (!courier.exists()) return;

        // Update Echoes animation
        echoNodes.forEach(en => {
            if (!en.node.exists() || en.data.path.length === 0) return;
            en.pTimer += dt();
            if (en.pTimer >= 0.03) {
                en.pTimer = 0;
                en.pathIdx = (en.pathIdx + 1) % en.data.path.length;
                en.node.pos = en.data.path[en.pathIdx];
            }
        });

        if (gameState === "DRAWING") {
            timeLeft -= dt();
            timerLabel.text = `TIME: ${Math.max(0, timeLeft).toFixed(1)}s`;

            if (timeLeft <= 0 || isKeyPressed("space")) {
                if (drawnPath.length < 5) {
                    drawnPath = [];
                    for(let i=0; i<=1.0; i+=0.05) {
                        drawnPath.push(startPos.lerp(portalPos, i));
                    }
                }
                gameState = "EXECUTING";
                phaseLabel.text = "PHASE: EXECUTION";
                phaseLabel.color = rgb(255, 0, 128);
            }
        } 
        else if (gameState === "EXECUTING") {
            executionTimer += dt();
            if (executionTimer >= 0.02 && executionIndex < drawnPath.length) {
                executionTimer = 0;
                courier.pos = drawnPath[executionIndex];
                executionIndex++;
            }

            // Hazard movement
            hazardObjs.forEach(hz => {
                if (!hz.exists()) return;
                let h = hz.hConfig;
                let offset = Math.sin(time() * (h.speed / 50)) * h.range;
                if (h.size.x > h.size.y) {
                    hz.pos.x = h.startX + offset;
                } else {
                    hz.pos.y = h.startY + offset;
                }
            });

            // Switch checking
            switchObjs.forEach(sz => {
                if (!sz.exists()) return;
                let s = sz.sConfig;
                let triggered = false;
                if (courier.isColliding(sz)) triggered = true;
                echoNodes.forEach(en => {
                    if (en.node.exists() && en.node.isColliding(sz)) triggered = true;
                });
                
                doorObjs.forEach(dz => {
                    if (!dz.exists()) return;
                    if (dz.dConfig.id === s.id) {
                        dz.dConfig.open = triggered;
                        if (triggered) {
                            dz.hidden = true;
                            if (dz.is("body")) dz.unuse("body");
                            sz.color = rgb(0, 255, 0);
                        } else {
                            dz.hidden = false;
                            if (!dz.is("body")) dz.use(body({ isStatic: true }));
                            sz.color = rgb(255, 255, 0);
                        }
                    }
                });
            });

            // Check Win Condition
            if (courier.isColliding(portal)) {
                gameState = "VICTORY";
                shake(10);
                add([
                    rect(1280, 720),
                    color(0,0,0),
                    opacity(0.7),
                    fixed(),
                    z(200)
                ]);
                add([
                    text("SECTOR SECURED!", { size: 48 }),
                    pos(center().x, center().y - 40),
                    anchor("center"),
                    color(0, 255, 128),
                    fixed(),
                    z(201)
                ]);

                let nextBtn = add([
                    rect(220, 50, { radius: 6 }),
                    pos(center().x, center().y + 40),
                    anchor("center"),
                    color(0, 255, 255),
                    area(),
                    fixed(),
                    z(201)
                ]);
                nextBtn.add([text("NEXT SHIFT", { size: 20 }), anchor("center"), color(0, 0, 0)]);

                nextBtn.onClick(() => {
                    if (sector % 5 === 0) {
                        window.showInterstitialAd();
                    }
                    echoesData.push({ path: [...drawnPath] });
                    go("game", { sector: sector + 1, echoes: echoesData, fails: 0 });
                });
                return;
            }

            // Check Failure (Hazard collision)
            let crashed = false;
            hazardObjs.forEach(hz => {
                if (hz.exists() && courier.isColliding(hz)) crashed = true;
            });

            if (crashed || executionIndex >= drawnPath.length) {
                if (crashed) {
                    shake(20);
                }
                gameState = "DEFEAT";
                fails++;

                if (fails >= 5) {
                    window.showRewardedAd(() => {
                        timeLeft += 5;
                        fails = 0;
                    });
                }

                echoesData.push({ path: [...drawnPath] });

                add([rect(1280, 720), color(0,0,0), opacity(0.7), fixed(), z(200)]);
                add([
                    text(crashed ? "TIMELINE COLLAPSE (CRASH)" : "PATH EXPIRED", { size: 42 }),
                    pos(center().x, center().y - 50),
                    anchor("center"),
                    color(255, 0, 128),
                    fixed(),
                    z(201)
                ]);

                let retryBtn = add([
                    rect(240, 50, { radius: 6 }),
                    pos(center().x, center().y + 30),
                    anchor("center"),
                    color(255, 255, 255),
                    area(),
                    fixed(),
                    z(201)
                ]);
                retryBtn.add([text("SPAWN ECHO & RETRY", { size: 16 }), anchor("center"), color(0, 0, 0)]);

                retryBtn.onClick(() => {
                    go("game", { sector: sector, echoes: echoesData, fails: fails });
                });
            }
        }
    });

    onKeyPress("r", () => {
        go("game", { sector: sector, echoes: echoesData, fails: fails });
    });

    onKeyPress("space", () => {
        if (gameState === "DRAWING") {
            timeLeft = 0.01;
        }
    });
});

go("menu");