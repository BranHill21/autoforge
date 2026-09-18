import kaboom from 'kaboom';

window.showInterstitialAd = () => { console.log("Ad Placeholder: Interstitial Ad Shown"); };
window.showRewardedAd = (rewardCallback) => { 
    console.log("Ad Placeholder: Rewarded Ad Shown"); 
    if (rewardCallback) rewardCallback();
};

kaboom({
    width: 800,
    height: 600,
    letterbox: true,
    background: [10, 14, 10],
});

let audioCtx = null;
function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn("AudioContext not supported");
    }
}

function playSynthTone(freq, type, duration, volume = 0.1, slideTo = null) {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
        }
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.warn("Audio Context Error: ", e);
    }
}

const SFX = {
    clack: () => playSynthTone(120, "triangle", 0.08, 0.4),
    snap: () => playSynthTone(440, "sine", 0.1, 0.3, 220),
    error: () => playSynthTone(180, "sawtooth", 0.3, 0.2, 90),
    success: () => {
        playSynthTone(261.63, "sine", 0.15, 0.2);
        setTimeout(() => playSynthTone(329.63, "sine", 0.15, 0.2), 80);
        setTimeout(() => playSynthTone(392.00, "sine", 0.15, 0.2), 160);
        setTimeout(() => playSynthTone(523.25, "sine", 0.3, 0.3), 240);
    },
    glitch: () => playSynthTone(600, "sawtooth", 0.1, 0.15, 50),
    alarm: () => playSynthTone(880, "sawtooth", 0.12, 0.2, 440),
    explode: () => playSynthTone(100, "sawtooth", 0.8, 0.4, 20),
};

let currentShift = 1;
let currentScore = 0;
let anchors = 3;
let endlessMode = false;

let saves = getData("temporal_archives") || [
    { name: "SEC-OFFICER", score: 1200, shift: 8 },
    { name: "CHRONO-PUNK", score: 850, shift: 5 },
    { name: "TIME-WRECKR", score: 400, shift: 3 }
];

function saveScore(name, score, shift) {
    saves.push({ name: name, score: score, shift: shift });
    saves.sort((a, b) => b.score - a.score);
    saves = saves.slice(0, 5);
    setData("temporal_archives", saves);
}

scene("menu", () => {
    initAudio();

    add([
        rect(width(), height()),
        color(10, 16, 10),
    ]);

    add([
        text("TEMPORAL CUSTOMS INSPECTOR", { size: 36, font: "monospace" }),
        pos(width() / 2, 100),
        anchor("center"),
        color(50, 220, 50),
    ]);

    add([
        text("SYSTEM-STATUS: ONLINE // ERA: 2084", { size: 14, font: "monospace" }),
        pos(width() / 2, 145),
        anchor("center"),
        color(40, 180, 40),
    ]);

    function createMenuButton(label, yPos, action) {
        const btn = add([
            rect(320, 45, { radius: 4 }),
            pos(width() / 2, yPos),
            anchor("center"),
            color(20, 40, 20),
            outline(2, rgb(50, 220, 50)),
            area(),
        ]);

        btn.add([
            text(label, { size: 15, font: "monospace" }),
            anchor("center"),
            color(50, 220, 50),
        ]);

        btn.onHoverUpdate(() => {
            btn.color = rgb(30, 80, 30);
        });

        btn.onHoverEnd(() => {
            btn.color = rgb(20, 40, 20);
        });

        btn.onClick(() => {
            SFX.clack();
            action();
        });
    }

    createMenuButton("INITIALIZE SHIFT (CAMPAIGN)", 240, () => {
        currentShift = 1;
        currentScore = 0;
        anchors = 3;
        endlessMode = false;
        go("game");
    });

    createMenuButton("INFINITE PARADOX (ENDLESS)", 310, () => {
        currentShift = 1;
        currentScore = 0;
        anchors = 3;
        endlessMode = true;
        go("game");
    });

    createMenuButton("TEMPORAL ARCHIVES (LEADERBOARD)", 380, () => {
        go("leaderboard");
    });

    add([
        text("SECURE THE TIMELINE. PACK THE CARGO. SPACEBAR TO VERIFY.", { size: 12, font: "monospace" }),
        pos(width() / 2, 480),
        anchor("center"),
        color(100, 100, 100),
    ]);

    add([
        text("V.3000 COMPLIANT PORTAL", { size: 10, font: "monospace" }),
        pos(width() / 2, 540),
        anchor("center"),
        color(50, 80, 50),
    ]);
});

scene("leaderboard", () => {
    add([
        rect(width(), height()),
        color(10, 16, 10),
    ]);

    add([
        text("TEMPORAL ARCHIVES", { size: 32, font: "monospace" }),
        pos(width() / 2, 80),
        anchor("center"),
        color(50, 220, 50),
    ]);

    let yOffset = 180;
    saves.forEach((entry, idx) => {
        add([
            text(`${idx + 1}. ${entry.name} - SCORE: ${entry.score} (SHIFT ${entry.shift})`, { size: 16, font: "monospace" }),
            pos(width() / 2, yOffset),
            anchor("center"),
            color(40, 180, 40),
        ]);
        yOffset += 40;
    });

    const backBtn = add([
        rect(200, 40, { radius: 4 }),
        pos(width() / 2, 480),
        anchor("center"),
        color(20, 40, 20),
        outline(2, rgb(50, 220, 50)),
        area(),
    ]);

    backBtn.add([
        text("RETURN", { size: 14, font: "monospace" }),
        anchor("center"),
        color(50, 220, 50),
    ]);

    backBtn.onHoverUpdate(() => {
        backBtn.color = rgb(30, 80, 30);
    });

    backBtn.onHoverEnd(() => {
        backBtn.color = rgb(20, 40, 20);
    });

    backBtn.onClick(() => {
        SFX.clack();
        go("menu");
    });
});

scene("game", () => {
    initAudio();

    let timeRemaining = Math.max(15, 30 - currentShift * 0.5);
    let items = [];
    let particles = [];
    let heldItem = null;
    let alarmTimer = 0;
    let inputReady = false;

    wait(0.1, () => { inputReady = true; });

    let gridState = [
        [[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null]],
        [[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null]],
        [[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null]]
    ];

    const GRID_SIZE = 4;
    const CELL_SIZE = 38;
    const GRID_X = [70, 310, 550];
    const GRID_Y = 180;

    const ERA_CONFIGS = [
        { name: "PAST CORE", color: rgb(40, 200, 40), scanColor: rgb(20, 80, 20) },
        { name: "PRESENT CORE", color: rgb(220, 150, 30), scanColor: rgb(80, 50, 10) },
        { name: "FUTURE CORE", color: rgb(30, 180, 220), scanColor: rgb(10, 60, 80) }
    ];

    const ITEM_TEMPLATES = [
        { name: "DINO FOSSIL", era: 0, w: 2, h: 2, color: rgb(40, 200, 40) },
        { name: "CLAY URN", era: 0, w: 1, h: 2, color: rgb(50, 180, 50) },
        { name: "RUNESTONE", era: 0, w: 1, h: 1, color: rgb(80, 220, 80) },
        
        { name: "FLOPPY DISK", era: 1, w: 1, h: 1, color: rgb(220, 150, 30) },
        { name: "VHS TAPE", era: 1, w: 2, h: 1, color: rgb(200, 130, 20) },
        { name: "CRT MONITOR", era: 1, w: 2, h: 2, color: rgb(240, 170, 40) },
        
        { name: "PLASMA CORE", era: 2, w: 1, h: 1, color: rgb(30, 180, 220) },
        { name: "LASER RIFLE", era: 2, w: 2, h: 1, color: rgb(20, 160, 200) },
        { name: "DARK MATRIX", era: 2, w: 2, h: 2, color: rgb(50, 200, 250) },

        { name: "TIME CHIP", era: 3, w: 1, h: 1, color: rgb(220, 220, 220) } 
    ];

    function spawnParticles(x, y, colorVal) {
        for (let i = 0; i < 12; i++) {
            particles.push({
                x: x,
                y: y,
                vx: rand(-150, 150),
                vy: rand(-150, 150),
                life: rand(0.3, 0.6),
                color: colorVal
            });
        }
    }

    function canPlaceItem(item, gridZ, startX, startY) {
        if (item.isBoss) {
            for (let z = 0; z < 3; z++) {
                for (let dy = 0; dy < item.h; dy++) {
                    for (let dx = 0; dx < item.w; dx++) {
                        let tx = startX + dx;
                        let ty = startY + dy;
                        if (tx >= GRID_SIZE || ty >= GRID_SIZE) return false;
                        if (gridState[z][ty][tx] !== null) return false;
                    }
                }
            }
            return true;
        }

        if (item.era !== 3 && item.era !== gridZ) return false;

        for (let dy = 0; dy < item.h; dy++) {
            for (let dx = 0; dx < item.w; dx++) {
                let tx = startX + dx;
                let ty = startY + dy;
                if (tx >= GRID_SIZE || ty >= GRID_SIZE) return false;
                if (gridState[gridZ][ty][tx] !== null) return false;
            }
        }
        return true;
    }

    function placeItem(item, gridZ, startX, startY) {
        item.placed = true;
        item.z = gridZ;
        item.gridX = startX;
        item.gridY = startY;

        if (item.isBoss) {
            for (let z = 0; z < 3; z++) {
                for (let dy = 0; dy < item.h; dy++) {
                    for (let dx = 0; dx < item.w; dx++) {
                        gridState[z][startY + dy][startX + dx] = item.id;
                    }
                }
            }
        } else {
            for (let dy = 0; dy < item.h; dy++) {
                for (let dx = 0; dx < item.w; dx++) {
                    gridState[gridZ][startY + dy][startX + dx] = item.id;
                }
            }
        }
        SFX.snap();
        spawnParticles(GRID_X[gridZ] + startX * CELL_SIZE + (item.w * CELL_SIZE)/2, GRID_Y + startY * CELL_SIZE + (item.h * CELL_SIZE)/2, item.color);
    }

    function removeItemFromGrid(item) {
        if (!item.placed) return;
        
        if (item.isBoss) {
            for (let z = 0; z < 3; z++) {
                for (let y = 0; y < GRID_SIZE; y++) {
                    for (let x = 0; x < GRID_SIZE; x++) {
                        if (gridState[z][y][x] === item.id) gridState[z][y][x] = null;
                    }
                }
            }
        } else {
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (gridState[item.z][y][x] === item.id) gridState[item.z][y][x] = null;
                }
            }
        }
        item.placed = false;
    }

    function triggerDetonation() {
        SFX.explode();
        shake(15);
        anchors--;
        
        if (anchors <= 0) {
            go("lose");
        } else {
            timeRemaining = 30;
            generateBoard();
        }
    }

    function generateBoard() {
        items = [];
        gridState = [
            [[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null]],
            [[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null]],
            [[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null]]
        ];
        heldItem = null;

        let totalItems = Math.min(3 + currentShift, 8); // Cap at 8 to fit on screen
        let idCounter = 1;
        let eraAreas = { 0: 0, 1: 0, 2: 0 };

        if (currentShift % 10 === 0) {
            items.push({
                id: idCounter++,
                name: "CHRONOS ENGINE",
                era: 3,
                w: 3,
                h: 3,
                color: rgb(255, 255, 255),
                placed: false,
                decay: 1.0,
                isBoss: true,
                corrupted: false,
                beltIndex: 0
            });
            totalItems = Math.max(1, totalItems - 3); // Account for boss space
            eraAreas[0] += 9;
            eraAreas[1] += 9;
            eraAreas[2] += 9;
        }

        for (let i = items.length; i < totalItems; i++) {
            let temp = null;
            let attempts = 0;
            while(attempts < 20) {
                temp = choose(ITEM_TEMPLATES.filter(it => it.era !== 3)); // Don't randomly pick bosses
                let area = temp.w * temp.h;
                if (eraAreas[temp.era] + area <= 16) {
                    eraAreas[temp.era] += area;
                    break;
                }
                attempts++;
            }
            if (attempts >= 20) {
                // Failsafe: find the emptiest era and force an item into it
                let emptiestEra = 0;
                if (eraAreas[1] < eraAreas[0]) emptiestEra = 1;
                if (eraAreas[2] < eraAreas[emptiestEra]) emptiestEra = 2;
                temp = ITEM_TEMPLATES.find(it => it.era === emptiestEra && (eraAreas[emptiestEra] + (it.w * it.h) <= 16));
                if (!temp) temp = ITEM_TEMPLATES.find(it => it.era === emptiestEra && it.w === 1 && it.h === 1); // fallback 1x1
                if (temp) {
                    eraAreas[emptiestEra] += (temp.w * temp.h);
                } else {
                    break; // Stop adding items if grid is completely full
                }
            }

            items.push({
                id: idCounter++,
                name: temp.name,
                era: temp.era,
                w: temp.w,
                h: temp.h,
                color: temp.color,
                placed: false,
                decay: 1.0,
                isBoss: false,
                corrupted: false,
                beltIndex: i,
                entangledWith: null
            });
        }

        if (currentShift >= 4) {
            if (items.length >= 2) {
                items[0].entangledWith = items[1].id;
                items[1].entangledWith = items[0].id;
            }
        }
    }

    generateBoard();

    const controller = add([
        pos(0, 0),
        z(10),
        "game_controller"
    ]);

    function getScreenGridCoords(mx, my) {
        for (let z = 0; z < 3; z++) {
            let gx = GRID_X[z];
            let gy = GRID_Y;
            let gWidth = GRID_SIZE * CELL_SIZE;
            if (mx >= gx && mx < gx + gWidth && my >= gy && my < gy + gWidth) {
                return {
                    z: z,
                    x: Math.floor((mx - gx) / CELL_SIZE),
                    y: Math.floor((my - gy) / CELL_SIZE)
                };
            }
        }
        return null;
    }

    function getConveyorItemAt(mx, my) {
        if (my >= 440 && my < 530) {
            let unplaced = items.filter(i => !i.placed && !i.corrupted);
            let total = unplaced.length;
            let startX = 400 - (total * 90) / 2;
            for (let idx = 0; idx < unplaced.length; idx++) {
                let item = unplaced[idx];
                let rx = startX + idx * 90;
                if (mx >= rx && mx < rx + 75) {
                    return item;
                }
            }
        }
        return null;
    }

    onMousePress(() => {
        if (!inputReady) return;
        let m = mousePos();
        
        if (heldItem) {
            let hover = getScreenGridCoords(m.x, m.y);
            if (hover) {
                if (canPlaceItem(heldItem, hover.z, hover.x, hover.y)) {
                    placeItem(heldItem, hover.z, hover.x, hover.y);
                    heldItem = null;
                } else {
                    SFX.error();
                }
            } else {
                heldItem = null;
                SFX.clack();
            }
        } else {
            let hover = getScreenGridCoords(m.x, m.y);
            if (hover) {
                let cellVal = gridState[hover.z][hover.y][hover.x];
                if (cellVal !== null) {
                    let clickedItem = items.find(i => i.id === cellVal);
                    if (clickedItem && !clickedItem.corrupted) {
                        removeItemFromGrid(clickedItem);
                        heldItem = clickedItem;
                        SFX.clack();
                    }
                }
            } else {
                let beltItem = getConveyorItemAt(m.x, m.y);
                if (beltItem) {
                    heldItem = beltItem;
                    SFX.clack();
                }
            }
        }
    });

    onKeyPress("r", () => {
        if (heldItem) {
            let temp = heldItem.w;
            heldItem.w = heldItem.h;
            heldItem.h = temp;
            SFX.clack();

            if (heldItem.entangledWith !== null) {
                let partner = items.find(i => i.id === heldItem.entangledWith);
                if (partner && !partner.placed) {
                    let pTemp = partner.w;
                    partner.w = partner.h;
                    partner.h = pTemp;
                }
            }
        }
    });

    onKeyPress("space", () => {
        let allPlaced = items.every(i => i.placed || i.corrupted);
        if (allPlaced) {
            let scoreAdd = items.filter(i => i.placed && !i.isBoss).length * 100 + (currentShift * 10);
            if (items.some(i => i.isBoss && i.placed)) {
                scoreAdd += 500;
            }
            currentScore += scoreAdd;
            currentShift++;
            SFX.success();
            
            if (!endlessMode && currentShift % 5 === 0) {
                window.showInterstitialAd();
            }

            go("intermission");
        } else {
            SFX.error();
            shake(5);
            timeRemaining -= 5;
        }
    });

    controller.onUpdate(() => {
        timeRemaining -= dt();
        if (timeRemaining <= 0) {
            triggerDetonation();
        }

        if (timeRemaining <= 5) {
            alarmTimer += dt();
            if (alarmTimer >= 0.5) {
                alarmTimer = 0;
                SFX.alarm();
                shake(1);
            }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx * dt();
            p.y += p.vy * dt();
            p.life -= dt();
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        if (currentShift >= 3) {
            items.forEach(item => {
                if (!item.placed && !item.corrupted) {
                    item.decay -= dt() * (0.015 + currentShift * 0.003);
                    if (item.decay <= 0) {
                        item.corrupted = true;
                        SFX.glitch();
                        anchors--;
                        shake(10);
                        if (anchors <= 0) {
                            triggerDetonation();
                            return;
                        }
                        let emptyCells = [];
                        for (let z = 0; z < 3; z++) {
                            for (let y = 0; y < GRID_SIZE; y++) {
                                for (let x = 0; x < GRID_SIZE; x++) {
                                    if (gridState[z][y][x] === null) {
                                        emptyCells.push({ z: z, x: x, y: y });
                                    }
                                }
                            }
                        }
                        if (emptyCells.length > 0) {
                            let spot = choose(emptyCells);
                            gridState[spot.z][spot.y][spot.x] = item.id;
                            item.placed = true;
                            item.z = spot.z;
                            item.gridX = spot.x;
                            item.gridY = spot.y;
                            item.w = 1;
                            item.h = 1;
                            item.color = rgb(100, 100, 100);
                        }
                    }
                }
            });
        }
    });

    controller.onDraw(() => {
        drawRect({
            pos: vec2(0, 0),
            width: width(),
            height: height(),
            color: rgb(10, 15, 10)
        });

        drawRect({
            pos: vec2(0, 0),
            width: width(),
            height: 60,
            color: rgb(5, 8, 5),
            outline: { color: rgb(40, 150, 40), width: 1 }
        });

        drawText({
            text: `SHIFT: ${currentShift}`,
            size: 16,
            pos: vec2(20, 22),
            color: rgb(50, 220, 50),
            font: "monospace"
        });

        drawText({
            text: `SCORE: ${currentScore}`,
            size: 16,
            pos: vec2(160, 22),
            color: rgb(50, 220, 50),
            font: "monospace"
        });

        let timerColor = timeRemaining > 5 ? rgb(50, 220, 50) : rgb(255, 50, 50);
        drawText({
            text: `STABILITY: ${Math.max(0, Math.ceil(timeRemaining))}s`,
            size: 16,
            pos: vec2(360, 22),
            color: timerColor,
            font: "monospace"
        });

        let anchorStr = "";
        for (let a = 0; a < 3; a++) {
            anchorStr += a < anchors ? "▲ " : "△ ";
        }
        drawText({
            text: `ANCHORS: ${anchorStr}`,
            size: 16,
            pos: vec2(600, 22),
            color: rgb(50, 220, 50),
            font: "monospace"
        });

        for (let z = 0; z < 3; z++) {
            let gx = GRID_X[z];
            let gy = GRID_Y;
            let config = ERA_CONFIGS[z];

            drawRect({
                pos: vec2(gx - 5, gy - 30),
                width: GRID_SIZE * CELL_SIZE + 10,
                height: GRID_SIZE * CELL_SIZE + 35,
                color: rgb(5, 10, 5),
                outline: { color: config.color, width: 2 }
            });

            drawText({
                text: config.name,
                size: 12,
                pos: vec2(gx + 5, gy - 22),
                color: config.color,
                font: "monospace"
            });

            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    drawRect({
                        pos: vec2(gx + x * CELL_SIZE, gy + y * CELL_SIZE),
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        color: rgb(10, 20, 10),
                        outline: { color: config.scanColor, width: 1 }
                    });
                }
            }
        }

        items.forEach(item => {
            if (item.placed) {
                let cellCol = item.corrupted ? rgb(60, 60, 60) : item.color;
                if (item.isBoss) {
                    for (let z = 0; z < 3; z++) {
                        drawRect({
                            pos: vec2(GRID_X[z] + item.gridX * CELL_SIZE + 2, GRID_Y + item.gridY * CELL_SIZE + 2),
                            width: item.w * CELL_SIZE - 4,
                            height: item.h * CELL_SIZE - 4,
                            color: rgb(20, 20, 20),
                            outline: { color: cellCol, width: 2 }
                        });
                        drawText({
                            text: "BOSS",
                            size: 10,
                            pos: vec2(GRID_X[z] + item.gridX * CELL_SIZE + 10, GRID_Y + item.gridY * CELL_SIZE + 10),
                            color: cellCol,
                            font: "monospace"
                        });
                    }
                } else {
                    drawRect({
                        pos: vec2(GRID_X[item.z] + item.gridX * CELL_SIZE + 2, GRID_Y + item.gridY * CELL_SIZE + 2),
                        width: item.w * CELL_SIZE - 4,
                        height: item.h * CELL_SIZE - 4,
                        color: rgb(15, 35, 15),
                        outline: { color: cellCol, width: 2 }
                    });

                    if (!item.corrupted) {
                        drawText({
                            text: item.name.substring(0, 8),
                            size: 8,
                            pos: vec2(GRID_X[item.z] + item.gridX * CELL_SIZE + 6, GRID_Y + item.gridY * CELL_SIZE + 12),
                            color: cellCol,
                            font: "monospace"
                        });
                    } else {
                        drawText({
                            text: "GLITCH",
                            size: 8,
                            pos: vec2(GRID_X[item.z] + item.gridX * CELL_SIZE + 6, GRID_Y + item.gridY * CELL_SIZE + 12),
                            color: rgb(200, 50, 50),
                            font: "monospace"
                        });
                    }
                }
            }
        });

        items.forEach(item => {
            if (item.entangledWith !== null) {
                let partner = items.find(i => i.id === item.entangledWith);
                if (partner) {
                    let p1 = vec2(0, 0);
                    let p2 = vec2(0, 0);

                    if (item.placed) {
                        p1 = vec2(GRID_X[item.z] + item.gridX * CELL_SIZE + (item.w * CELL_SIZE)/2, GRID_Y + item.gridY * CELL_SIZE + (item.h * CELL_SIZE)/2);
                    } else {
                        let unplaced = items.filter(i => !i.placed && !i.corrupted);
                        let startX = 400 - (unplaced.length * 90) / 2;
                        let actualIndex = unplaced.findIndex(i => i.id === item.id);
                        p1 = vec2(startX + actualIndex * 90 + 37, 485);
                    }

                    if (partner.placed) {
                        p2 = vec2(GRID_X[partner.z] + partner.gridX * CELL_SIZE + (partner.w * CELL_SIZE)/2, GRID_Y + partner.gridY * CELL_SIZE + (partner.h * CELL_SIZE)/2);
                    } else {
                        let unplaced = items.filter(i => !i.placed && !i.corrupted);
                        let startX = 400 - (unplaced.length * 90) / 2;
                        let actualIndex = unplaced.findIndex(i => i.id === partner.id);
                        p2 = vec2(startX + actualIndex * 90 + 37, 485);
                    }

                    drawLine({
                        p1: p1,
                        p2: p2,
                        width: 1,
                        color: rgb(255, 50, 255),
                        opacity: 0.4
                    });
                }
            }
        });

        drawRect({
            pos: vec2(50, 415),
            width: 700,
            height: 110,
            color: rgb(5, 10, 5),
            outline: { color: rgb(40, 120, 40), width: 1 }
        });

        drawText({
            text: "INFLUX CONVEYOR BELT",
            size: 10,
            pos: vec2(60, 425),
            color: rgb(40, 180, 40),
            font: "monospace"
        });

        let unplacedItems = items.filter(i => !i.placed && !i.corrupted);
        let startX = 400 - (unplacedItems.length * 90) / 2;

        unplacedItems.forEach((item, index) => {
            let rx = startX + index * 90;
            let ry = 440;

            drawRect({
                pos: vec2(rx, ry),
                width: 75,
                height: 75,
                color: rgb(10, 25, 10),
                outline: { color: item.color, width: 1.5 }
            });

            drawText({
                text: item.name.substring(0, 10),
                size: 8,
                pos: vec2(rx + 5, ry + 10),
                color: item.color,
                font: "monospace"
            });

            drawText({
                text: `${item.w}x${item.h}`,
                size: 8,
                pos: vec2(rx + 5, ry + 25),
                color: rgb(150, 150, 150),
                font: "monospace"
            });

            if (currentShift >= 3) {
                drawRect({
                    pos: vec2(rx + 5, ry + 60),
                    width: 65,
                    height: 5,
                    color: rgb(30, 30, 30)
                });
                drawRect({
                    pos: vec2(rx + 5, ry + 60),
                    width: 65 * item.decay,
                    height: 5,
                    color: item.decay > 0.4 ? rgb(50, 200, 50) : rgb(200, 50, 50)
                });
            }

            if (item.entangledWith !== null) {
                drawText({
                    text: "[LINKED]",
                    size: 8,
                    pos: vec2(rx + 5, ry + 40),
                    color: rgb(255, 50, 255),
                    font: "monospace"
                });
            }
        });

        if (heldItem) {
            let m = mousePos();
            let hover = getScreenGridCoords(m.x, m.y);
            
            if (hover) {
                let cellCol = canPlaceItem(heldItem, hover.z, hover.x, hover.y) ? rgb(50, 255, 50) : rgb(255, 50, 50);
                
                if (heldItem.isBoss) {
                    for (let z = 0; z < 3; z++) {
                        drawRect({
                            pos: vec2(GRID_X[z] + hover.x * CELL_SIZE, GRID_Y + hover.y * CELL_SIZE),
                            width: heldItem.w * CELL_SIZE,
                            height: heldItem.h * CELL_SIZE,
                            color: rgb(cellCol.r, cellCol.g, cellCol.b),
                            opacity: 0.3,
                            outline: { color: cellCol, width: 2 }
                        });
                    }
                } else {
                    drawRect({
                        pos: vec2(GRID_X[hover.z] + hover.x * CELL_SIZE, GRID_Y + hover.y * CELL_SIZE),
                        width: heldItem.w * CELL_SIZE,
                        height: heldItem.h * CELL_SIZE,
                        color: rgb(cellCol.r, cellCol.g, cellCol.b),
                        opacity: 0.3,
                        outline: { color: cellCol, width: 2 }
                    });
                }
            }

            drawRect({
                pos: vec2(m.x - 20, m.y - 20),
                width: heldItem.w * 25,
                height: heldItem.h * 25,
                color: rgb(heldItem.color.r, heldItem.color.g, heldItem.color.b),
                opacity: 0.7,
                outline: { color: rgb(255, 255, 255), width: 1.5 }
            });
        }

        particles.forEach(p => {
            drawCircle({
                pos: vec2(p.x, p.y),
                radius: p.life * 4,
                color: p.color
            });
        });

        let instructionText = "DRAG ITEMS TO ERA CORES // PRESS 'R' TO ROTATE // PRESS SPACEBAR TO VERIFY";
        if (currentShift === 1) {
            instructionText = "ONBOARDING: Place GREEN items in PAST, AMBER in PRESENT, CYAN in FUTURE. Verify with SPACEBAR.";
        } else if (currentShift === 3) {
            instructionText = "DANGER IMMINENT: Conveyor items are decaying! Place them before they corrupt timelines!";
        } else if (currentShift === 4) {
            instructionText = "QUANTUM ENTANGLEMENT DETECTED: Rotating linked items rotates both! Coordinate coordinates.";
        } else if (currentShift % 10 === 0) {
            instructionText = "BOSS ANOMALY: Chronos Engine must be placed across ALL 3 TIMELINES simultaneously!";
        }

        drawText({
            text: instructionText,
            size: 11,
            pos: vec2(width() / 2, 560),
            color: rgb(40, 180, 40),
            anchor: "center",
            font: "monospace"
        });

        for (let y = 0; y < height(); y += 4) {
            drawRect({
                pos: vec2(0, y),
                width: width(),
                height: 1.5,
                color: rgb(0, 0, 0),
                opacity: 0.12,
                fixed: true
            });
        }
    });
});

scene("intermission", () => {
    initAudio();

    add([
        rect(width(), height()),
        color(10, 16, 10),
    ]);

    add([
        text(`SHIFT ${currentShift - 1} SECURED`, { size: 24, font: "monospace" }),
        pos(width() / 2, 100),
        anchor("center"),
        color(50, 220, 50),
    ]);

    add([
        text(`SCORE: ${currentScore}`, { size: 16, font: "monospace" }),
        pos(width() / 2, 150),
        anchor("center"),
        color(50, 220, 50),
    ]);

    let warningText = "";
    if (currentShift === 3) {
        warningText = "[WARNING] TEMPORAL DECAY DETECTED.\nItems on the conveyor will now corrupt over time.\nIf an item corrupts, it locks to the board and disrupts 1 ANCHOR.\nPlace items quickly to avoid temporal damage!";
    } else if (currentShift === 4) {
        warningText = "[WARNING] QUANTUM ENTANGLEMENT DETECTED.\nSome items are linked. Rotating one rotates both.\nPlan your placements carefully.";
    }

    if (warningText) {
        add([
            text(warningText, { size: 12, font: "monospace", align: "center", width: 600 }),
            pos(width() / 2, 250),
            anchor("center"),
            color(220, 50, 50),
        ]);
    }

    const nextBtn = add([
        rect(320, 45, { radius: 4 }),
        pos(width() / 2, 400),
        anchor("center"),
        color(20, 40, 20),
        outline(2, rgb(50, 220, 50)),
        area(),
    ]);

    nextBtn.add([
        text("INITIALIZE NEXT SHIFT", { size: 14, font: "monospace" }),
        anchor("center"),
        color(50, 220, 50),
    ]);

    nextBtn.onHoverUpdate(() => {
        nextBtn.color = rgb(30, 80, 30);
    });

    nextBtn.onHoverEnd(() => {
        nextBtn.color = rgb(20, 40, 20);
    });

    nextBtn.onClick(() => {
        SFX.clack();
        go("game");
    });
});

scene("lose", () => {
    initAudio();

    add([
        rect(width(), height()),
        color(0, 0, 150),
    ]);

    add([
        text("*** SYSTEM PARADOX TERMINATION ***", { size: 24, font: "monospace" }),
        pos(width() / 2, 100),
        anchor("center"),
        color(255, 255, 255),
    ]);

    add([
        text("A critical temporal anomaly has collapsed the active timeline.", { size: 14, font: "monospace" }),
        pos(width() / 2, 150),
        anchor("center"),
        color(200, 200, 255),
    ]);

    add([
        text("ERROR 2084: QUANTUM_GRID_OVERFLOW\nTIMELINE STABILITY: 0.00%\nANCHORS DISRUPTED", { size: 12, font: "monospace" }),
        pos(100, 200),
        color(200, 200, 255),
    ]);

    add([
        text(`FINAL SCORE RECOVERED: ${currentScore}`, { size: 18, font: "monospace" }),
        pos(width() / 2, 290),
        anchor("center"),
        color(255, 255, 50),
    ]);

    add([
        text(`LAST SHIFT REGISTERED: ${currentShift}`, { size: 14, font: "monospace" }),
        pos(width() / 2, 325),
        anchor("center"),
        color(255, 255, 255),
    ]);

    const resumeBtn = add([
        rect(380, 45, { radius: 4 }),
        pos(width() / 2, 400),
        anchor("center"),
        color(0, 0, 100),
        outline(2, rgb(255, 255, 255)),
        area(),
    ]);

    resumeBtn.add([
        text("PARADOX RESUME (WATCH AD - +1 ANCHOR)", { size: 11, font: "monospace" }),
        anchor("center"),
        color(255, 255, 255),
    ]);

    resumeBtn.onHoverUpdate(() => {
        resumeBtn.color = rgb(50, 50, 200);
    });
    resumeBtn.onHoverEnd(() => {
        resumeBtn.color = rgb(0, 0, 100);
    });

    resumeBtn.onClick(() => {
        window.showRewardedAd(() => {
            anchors = 1;
            SFX.success();
            go("game");
        });
    });

    const menuBtn = add([
        rect(380, 45, { radius: 4 }),
        pos(width() / 2, 465),
        anchor("center"),
        color(0, 0, 100),
        outline(2, rgb(255, 255, 255)),
        area(),
    ]);

    menuBtn.add([
        text("DE-INITIALIZE SYSTEM (MAIN MENU)", { size: 11, font: "monospace" }),
        anchor("center"),
        color(255, 255, 255),
    ]);

    menuBtn.onHoverUpdate(() => {
        menuBtn.color = rgb(50, 50, 200);
    });
    menuBtn.onHoverEnd(() => {
        menuBtn.color = rgb(0, 0, 100);
    });

    menuBtn.onClick(() => {
        SFX.clack();
        window.showInterstitialAd();
        saveScore("INSPECTOR", currentScore, currentShift);
        go("menu");
    });
});

go("menu");