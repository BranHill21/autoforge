window.showInterstitialAd = () => {
    console.log("Ad Hook: showInterstitialAd() triggered.");
};
window.showRewardedAd = (rewardCallback) => {
    console.log("Ad Hook: showRewardedAd() triggered.");
    if (rewardCallback) rewardCallback();
};

window.addEventListener("contextmenu", (e) => e.preventDefault());

let audioCtx = null;
let gravityOsc = null;
let gravityGain = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

const PENTATONIC_FREQS = [261.63, 293.66, 329.63, 392.00, 440.00];

function playFusionSound(tier) {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    const freq = PENTATONIC_FREQS[(tier - 1) % PENTATONIC_FREQS.length];
    osc.frequency.setValueAtTime(freq, now);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 1.5, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.8);
    osc2.stop(now + 0.8);
}

function playFractureSound() {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.35);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
}

function playPulseSound() {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.6);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
}

function playAlarmSound() {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.25);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
}

function startGravityHum() {
    initAudio();
    if (!audioCtx || gravityOsc) return;
    const now = audioCtx.currentTime;
    gravityOsc = audioCtx.createOscillator();
    gravityGain = audioCtx.createGain();

    gravityOsc.type = "triangle";
    gravityOsc.frequency.setValueAtTime(75, now);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(150, now);

    gravityGain.gain.setValueAtTime(0.001, now);
    gravityGain.gain.linearRampToValueAtTime(0.12, now + 0.3);

    gravityOsc.connect(filter);
    filter.connect(gravityGain);
    gravityGain.connect(audioCtx.destination);
    gravityOsc.start();
}

function updateGravityHum(mass) {
    if (!audioCtx || !gravityOsc) return;
    const now = audioCtx.currentTime;
    const targetFreq = 75 + Math.min(mass * 8, 150);
    gravityOsc.frequency.setTargetAtTime(targetFreq, now, 0.15);
}

function stopGravityHum() {
    if (!gravityOsc) return;
    const now = audioCtx.currentTime;
    try {
        gravityGain.gain.cancelScheduledValues(now);
        gravityGain.gain.setValueAtTime(gravityGain.gain.value, now);
        gravityGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        const oscToStop = gravityOsc;
        setTimeout(() => {
            try { oscToStop.stop(); } catch (e) {}
        }, 180);
    } catch (e) {}
    gravityOsc = null;
    gravityGain = null;
}

import kaboom from "kaboom";
kaboom({
    width: 800,
    height: 600,
    letterbox: true,
    background: [6, 4, 15],
});

const TIERS = [
    null,
    { tier: 1, name: "Hydrogen", color: rgb(255, 20, 147), radius: 12, mass: 1.0, points: 10, code: "H" },
    { tier: 2, name: "Helium", color: rgb(0, 191, 255), radius: 18, mass: 2.0, points: 25, code: "He" },
    { tier: 3, name: "Carbon", color: rgb(50, 205, 50), radius: 26, mass: 4.0, points: 60, code: "C" },
    { tier: 4, name: "Oxygen", color: rgb(255, 140, 0), radius: 36, mass: 8.0, points: 150, code: "O" },
    { tier: 5, name: "Iron Core", color: rgb(255, 215, 0), radius: 48, mass: 16.0, points: 500, code: "Fe" }
];

let globalContinueUsed = false;
let globalHighScore = 0;

scene("menu", () => {
    add([
        rect(width(), height()),
        pos(0, 0),
        color(10, 8, 24),
    ]);

    for (let i = 0; i < 40; i++) {
        add([
            pos(rand(0, width()), rand(0, height())),
            circle(rand(1, 3)),
            color(255, 255, 255),
            opacity(rand(0.2, 0.7)),
        ]);
    }

    add([
        text("GRAV-COLLAPSE", { size: 52, font: "sans-serif" }),
        pos(width() / 2, 160),
        anchor("center"),
        color(0, 255, 204),
    ]);

    add([
        text("SPACETIME ORBITAL MATCHER", { size: 18, letterSpacing: 3 }),
        pos(width() / 2, 215),
        anchor("center"),
        color(180, 180, 200),
    ]);

    const instructionBox = add([
        rect(550, 160, { rx: 8, ry: 8 }),
        pos(width() / 2, 330),
        anchor("center"),
        color(20, 18, 42),
        outline(2, rgb(80, 80, 120))
    ]);

    instructionBox.add([
        text("CONTROLS:\n• HOLD LEFT-CLICK: Attract elements to gravity cursor\n• HOLD RIGHT-CLICK: Repel elements away\n• SPACEBAR: Activate Singularity Pulse (clears Space Dust)\n\nHOW TO SURVIVE:\n• Merge identical elements at soft speeds\n• Avoid mismatched or high-speed collisions (creates Instability)\n• Feed final-tier Iron Cores (Fe) to the central Singularity!", {
            size: 13,
            lineSpacing: 5,
            width: 510
        }),
        pos(0, 0),
        anchor("center"),
        color(220, 220, 240)
    ]);

    const startBtn = add([
        rect(220, 50, { rx: 10, ry: 10 }),
        pos(width() / 2, 470),
        anchor("center"),
        color(0, 255, 150),
        area(),
    ]);

    startBtn.add([
        text("START EXPERIMENT", { size: 16, font: "sans-serif" }),
        anchor("center"),
        color(0, 0, 0)
    ]);

    startBtn.onHoverUpdate(() => {
        startBtn.color = rgb(0, 200, 120);
    });

    startBtn.onHoverEnd(() => {
        startBtn.color = rgb(0, 255, 150);
    });

    startBtn.onClick(() => {
        initAudio();
        go("game");
    });
});

scene("game", () => {
    initAudio();

    let score = 0;
    let combo = 1;
    let comboTimer = 0;
    let instability = 0;
    let pulseCooldown = 0;
    let secondsElapsed = 0;
    let firstIronCoreUnlocked = false;
    let gravityShieldTimer = 0;

    const center = vec2(width() / 2, height() / 2);

    add([
        rect(width(), height()),
        pos(0, 0),
        color(8, 5, 20),
        z(-10)
    ]);

    for (let i = 0; i < 50; i++) {
        add([
            pos(rand(0, width()), rand(0, height())),
            circle(rand(1, 2)),
            color(255, 255, 255),
            opacity(rand(0.15, 0.5)),
            z(-5)
        ]);
    }

    onDraw(() => {
        const rows = 15;
        const cols = 20;
        const stepX = width() / cols;
        const stepY = height() / rows;

        for (let i = 0; i <= cols; i++) {
            const points = [];
            for (let j = 0; j <= rows; j++) {
                let p = vec2(i * stepX, j * stepY);
                p = warpPoint(p);
                points.push(p);
            }
            for (let j = 0; j < points.length - 1; j++) {
                drawLine({
                    p1: points[j],
                    p2: points[j + 1],
                    width: 1.0,
                    color: rgb(30, 25, 60),
                    opacity: 0.4
                });
            }
        }

        for (let j = 0; j <= rows; j++) {
            const points = [];
            for (let i = 0; i <= cols; i++) {
                let p = vec2(i * stepX, j * stepY);
                p = warpPoint(p);
                points.push(p);
            }
            for (let i = 0; i < points.length - 1; i++) {
                drawLine({
                    p1: points[i],
                    p2: points[i + 1],
                    width: 1.0,
                    color: rgb(30, 25, 60),
                    opacity: 0.4
                });
            }
        }
    });

    function warpPoint(p) {
        let warped = p.clone();

        let toCenter = center.sub(p);
        let dCenter = toCenter.len();
        if (dCenter > 25) {
            let centerForce = 5000 / (dCenter + 60);
            warped = warped.add(toCenter.unit().scale(centerForce));
        }

        if (mousePos()) {
            let mPos = mousePos();
            let toMouse = mPos.sub(p);
            let dMouse = toMouse.len();
            if (dMouse > 15) {
                if (isMouseDown("left")) {
                    let force = 6500 / (dMouse + 50);
                    warped = warped.add(toMouse.unit().scale(force));
                } else if (isMouseDown("right")) {
                    let force = 5000 / (dMouse + 50);
                    warped = warped.sub(toMouse.unit().scale(force * 0.7));
                }
            }
        }
        return warped;
    }

    const singularityRadius = 42;
    const singularity = add([
        circle(singularityRadius),
        pos(center),
        anchor("center"),
        color(0, 0, 0),
        area(),
        "singularity"
    ]);

    singularity.add([
        circle(singularityRadius + 6),
        anchor("center"),
        color(0, 255, 230),
        opacity(0.12),
        z(-1)
    ]);

    const instabContainer = add([
        rect(220, 24, { rx: 6, ry: 6 }),
        pos(20, 20),
        color(20, 15, 35),
        outline(1.5, rgb(60, 50, 90))
    ]);

    const instabBar = instabContainer.add([
        rect(0, 16, { rx: 4, ry: 4 }),
        pos(4, 4),
        color(0, 255, 120),
    ]);

    const instabText = instabContainer.add([
        text("SYSTEM STABLE", { size: 10 }),
        pos(10, 7),
        color(255, 255, 255)
    ]);

    const scoreLabel = add([
        text("SCORE: 0", { size: 18 }),
        pos(width() - 220, 20),
        color(255, 255, 255)
    ]);

    const comboLabel = add([
        text("COMBO x1", { size: 14 }),
        pos(width() - 220, 45),
        color(255, 215, 0)
    ]);

    const comboBar = add([
        rect(0, 4),
        pos(width() - 220, 65),
        color(255, 215, 0)
    ]);

    const pulseLabel = add([
        text("PULSE DETONATOR: READY", { size: 11 }),
        pos(20, 55),
        color(0, 255, 240)
    ]);

    const adsButton = add([
        rect(190, 28, { rx: 6, ry: 6 }),
        pos(20, 80),
        color(100, 30, 200),
        outline(1, rgb(150, 80, 255)),
        area(),
    ]);

    adsButton.add([
        text("BYPASS COOLDOWN [AD]", { size: 9 }),
        pos(10, 9),
        color(255, 255, 255)
    ]);

    adsButton.onHoverUpdate(() => {
        adsButton.color = rgb(130, 50, 240);
    });

    adsButton.onHoverEnd(() => {
        adsButton.color = rgb(100, 30, 200);
    });

    adsButton.onClick(() => {
        if (pulseCooldown > 0) {
            window.showRewardedAd(() => {
                pulseCooldown = 0;
                pulseLabel.text = "PULSE DETONATOR: READY";
                pulseLabel.color = rgb(0, 255, 240);
            });
        }
    });

    const shieldLabel = add([
        text("", { size: 12 }),
        pos(width() / 2, 80),
        anchor("center"),
        color(255, 50, 100)
    ]);

    function createExplosion(posVec, col, count = 15, sizeMin = 2, sizeMax = 6) {
        for (let i = 0; i < count; i++) {
            const angle = rand(0, Math.PI * 2);
            const speed = rand(60, 280);
            add([
                pos(posVec),
                circle(rand(sizeMin, sizeMax)),
                color(col),
                move(angle, speed),
                lifespan(0.5, { fade: 0.4 }),
                anchor("center")
            ]);
        }
    }

    function spawnElement(tierIndex, customPos, customVel) {
        const data = TIERS[tierIndex];
        const p = customPos || getRandomSpawnPos();
        const v = customVel || getRandomSpawnVel(p);

        const e = add([
            pos(p),
            color(data.color),
            circle(data.radius),
            anchor("center"),
            area(),
            "element",
            {
                tier: tierIndex,
                vel: v,
                mass: data.mass,
                name: data.name,
                code: data.code,
                trail: []
            }
        ]);

        e.add([
            text(data.code, { size: Math.max(9, data.radius * 0.75) }),
            anchor("center"),
            color(255, 255, 255)
        ]);

        return e;
    }

    function getRandomSpawnPos() {
        const angle = rand(0, Math.PI * 2);
        const radius = 390;
        return center.add(vec2(Math.cos(angle) * radius, Math.sin(angle) * radius));
    }

    function getRandomSpawnVel(p) {
        const toCenter = center.sub(p).unit();
        const tangent = vec2(-toCenter.y, toCenter.x);
        const speedIn = rand(25, 45);
        const speedOrbit = rand(-65, 65);
        return toCenter.scale(speedIn).add(tangent.scale(speedOrbit));
    }

    function spawnSpaceDust(p, customVel) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(40, 120);
        const v = customVel || vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);

        add([
            pos(p),
            color(140, 140, 150),
            circle(6),
            anchor("center"),
            area(),
            "spacedust",
            {
                vel: v,
                mass: 0.45
            }
        ]);
    }

    let alarmPulseTimer = 0;
    onUpdate(() => {
        secondsElapsed += dt();

        if (gravityShieldTimer > 0) {
            gravityShieldTimer -= dt();
            shieldLabel.text = `GRAVITY SHIELD ACTIVE: ${Math.ceil(gravityShieldTimer)}s`;
            if (gravityShieldTimer <= 0) {
                shieldLabel.text = "";
            }
        }

        if (pulseCooldown > 0) {
            pulseCooldown -= dt();
            pulseLabel.text = `PULSE COOLDOWN: ${Math.ceil(pulseCooldown)}s`;
            pulseLabel.color = rgb(150, 150, 150);
            adsButton.hidden = false;
        } else {
            pulseLabel.text = "PULSE DETONATOR: READY (SPACEBAR)";
            pulseLabel.color = rgb(0, 255, 240);
            adsButton.hidden = true;
        }

        if (comboTimer > 0) {
            comboTimer -= dt();
            comboBar.width = (comboTimer / 4.0) * 120;
            if (comboTimer <= 0) {
                combo = 1;
                comboLabel.text = "COMBO x1";
                comboBar.width = 0;
            }
        }

        const dustCount = get("spacedust").length;
        const targetInstab = Math.min(100, dustCount * 4.2);
        if (instability < targetInstab) {
            instability = Math.min(100, instability + dt() * 15);
        } else if (instability > targetInstab) {
            instability = Math.max(0, instability - dt() * 6);
        }

        instabBar.width = (instability / 100.0) * 212;

        if (instability >= 75) {
            instabBar.color = rgb(255, 30, 50);
            alarmPulseTimer += dt();
            if (alarmPulseTimer >= 0.6) {
                alarmPulseTimer = 0;
                playAlarmSound();
            }
            if (Math.floor(time() * 4) % 2 === 0) {
                instabText.text = "CRITICAL INSTABILITY!";
                instabText.color = rgb(255, 30, 50);
            } else {
                instabText.text = "WARNING: NO CORE SHIELD";
                instabText.color = rgb(255, 255, 255);
            }
        } else if (instability >= 40) {
            instabBar.color = rgb(255, 140, 0);
            instabText.text = "WARNING: HIGH DEBRIS";
            instabText.color = rgb(255, 140, 0);
        } else {
            instabBar.color = rgb(0, 255, 120);
            instabText.text = "SYSTEM STABLE";
            instabText.color = rgb(200, 255, 220);
        }

        if (instability >= 100) {
            triggerSupernova();
        }

        let isAttracting = isMouseDown("left");

        if (isAttracting && mousePos()) {
            startGravityHum();
            let totalMassPulled = 0;
            get("element").forEach(e => {
                if (e.pos.dist(mousePos()) < 220) {
                    totalMassPulled += e.mass;
                }
            });
            updateGravityHum(totalMassPulled);
        } else {
            stopGravityHum();
        }

        const elements = get("element");
        for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                const e1 = elements[i];
                const e2 = elements[j];
                const dist = e1.pos.dist(e2.pos);
                const minDist = e1.radius + e2.radius;

                if (dist < minDist) {
                    const overlap = minDist - dist;
                    const dir = e1.pos.sub(e2.pos).unit();

                    e1.pos = e1.pos.add(dir.scale(overlap * 0.5));
                    e2.pos = e2.pos.sub(dir.scale(overlap * 0.5));

                    const relVel = e1.vel.sub(e2.vel);
                    const speed = relVel.dot(dir);

                    if (speed < 0) {
                        const impulse = (2 * speed) / (e1.mass + e2.mass);
                        e1.vel = e1.vel.sub(dir.scale(impulse * e2.mass));
                        e2.vel = e2.vel.add(dir.scale(impulse * e1.mass));

                        const relSpeedMag = relVel.len();
                        const speedThreshold = 180;

                        if (e1.tier === e2.tier) {
                            if (relSpeedMag < speedThreshold || gravityShieldTimer > 0) {
                                fuseElements(e1, e2);
                            } else {
                                fractureElements(e1, e2);
                            }
                        } else {
                            if (gravityShieldTimer <= 0) {
                                fractureElements(e1, e2);
                            }
                        }
                    }
                }
            }
        }

        const dusts = get("spacedust");
        for (let i = 0; i < dusts.length; i++) {
            for (let j = i + 1; j < dusts.length; j++) {
                const d1 = dusts[i];
                const d2 = dusts[j];
                const dist = d1.pos.dist(d2.pos);
                const minDist = d1.radius + d2.radius;
                if (dist < minDist) {
                    const overlap = minDist - dist;
                    const dir = d1.pos.sub(d2.pos).unit();
                    d1.pos = d1.pos.add(dir.scale(overlap * 0.5));
                    d2.pos = d2.pos.sub(dir.scale(overlap * 0.5));

                    const relVel = d1.vel.sub(d2.vel);
                    const speed = relVel.dot(dir);
                    if (speed < 0) {
                        const impulse = speed;
                        d1.vel = d1.vel.sub(dir.scale(impulse));
                        d2.vel = d2.vel.add(dir.scale(impulse));
                    }
                }
            }
        }
    });

    function fuseElements(e1, e2) {
        const nextTierIndex = e1.tier + 1;
        const spawnP = e1.pos.add(e2.pos).scale(0.5);
        const totalMass = e1.mass + e2.mass;
        const conservVel = e1.vel.scale(e1.mass).add(e2.vel.scale(e2.mass)).scale(1.0 / totalMass);

        createExplosion(spawnP, e1.color, 12, 3, 7);
        playFusionSound(e1.tier);

        const basePoints = TIERS[e1.tier].points;
        const payout = basePoints * combo;
        score += payout;
        scoreLabel.text = `SCORE: ${score}`;

        combo++;
        comboTimer = 4.0;
        comboLabel.text = `COMBO x${combo}`;

        destroy(e1);
        destroy(e2);

        if (nextTierIndex <= 5) {
            spawnElement(nextTierIndex, spawnP, conservVel);
            if (nextTierIndex === 5 && !firstIronCoreUnlocked) {
                firstIronCoreUnlocked = true;
                window.showInterstitialAd();
            }
        } else {
            createExplosion(spawnP, rgb(255, 255, 255), 30, 4, 10);
        }
    }

    function fractureElements(e1, e2) {
        const contactP = e1.pos.add(e2.pos).scale(0.5);
        createExplosion(contactP, rgb(255, 50, 50), 16, 2, 5);
        playFractureSound();

        const spawnVelocityScale = 110;
        const numDust = randi(3, 6);
        for (let i = 0; i < numDust; i++) {
            const a = rand(0, Math.PI * 2);
            const devV = vec2(Math.cos(a) * spawnVelocityScale, Math.sin(a) * spawnVelocityScale);
            spawnSpaceDust(contactP, devV);
        }

        destroy(e1);
        destroy(e2);
    }

    onUpdate("element", (e) => {
        let totalAcc = vec2(0, 0);

        let toCenter = center.sub(e.pos);
        let dCenter = toCenter.len();
        if (dCenter > singularityRadius) {
            let f = (180 * e.mass) / (dCenter * 0.6);
            totalAcc = totalAcc.add(toCenter.unit().scale(f / e.mass));
        } else {
            if (e.tier === 5) {
                absorbIronCore(e);
            } else {
                crushMismatchedCore(e);
            }
            return;
        }

        if (isMouseDown("left") && mousePos()) {
            let toMouse = mousePos().sub(e.pos);
            let dMouse = toMouse.len();
            if (dMouse < 280 && dMouse > 10) {
                let f = (260 * e.mass) / (dMouse * 0.5 + 40);
                totalAcc = totalAcc.add(toMouse.unit().scale(f / e.mass));
            }
        } else if ((isMouseDown("right") || isKeyDown("shift")) && mousePos()) {
            let toMouse = mousePos().sub(e.pos);
            let dMouse = toMouse.len();
            if (dMouse < 280 && dMouse > 10) {
                let f = (320 * e.mass) / (dMouse * 0.4 + 40);
                totalAcc = totalAcc.sub(toMouse.unit().scale(f / e.mass));
            }
        }

        e.vel = e.vel.add(totalAcc.scale(dt()));
        e.vel = e.vel.scale(0.985);
        e.pos = e.pos.add(e.vel.scale(dt()));

        e.trail.push(e.pos.clone());
        if (e.trail.length > 7) e.trail.shift();
    });

    onUpdate("spacedust", (d) => {
        let totalAcc = vec2(0, 0);

        let toCenter = center.sub(d.pos);
        let dCenter = toCenter.len();
        if (dCenter > singularityRadius) {
            let f = (140 * d.mass) / (dCenter * 0.5);
            totalAcc = totalAcc.add(toCenter.unit().scale(f / d.mass));
        } else {
            destroy(d);
            return;
        }

        if (isMouseDown("left") && mousePos()) {
            let toMouse = mousePos().sub(d.pos);
            let dMouse = toMouse.len();
            if (dMouse < 280 && dMouse > 10) {
                let f = (180 * d.mass) / (dMouse * 0.5 + 40);
                totalAcc = totalAcc.add(toMouse.unit().scale(f / d.mass));
            }
        } else if ((isMouseDown("right") || isKeyDown("shift")) && mousePos()) {
            let toMouse = mousePos().sub(d.pos);
            let dMouse = toMouse.len();
            if (dMouse < 280 && dMouse > 10) {
                let f = (220 * d.mass) / (dMouse * 0.4 + 40);
                totalAcc = totalAcc.sub(toMouse.unit().scale(f / d.mass));
            }
        }

        d.vel = d.vel.add(totalAcc.scale(dt()));
        d.vel = d.vel.scale(0.98);
        d.pos = d.pos.add(d.vel.scale(dt()));
    });

    onDraw("element", (e) => {
        for (let i = 0; i < e.trail.length; i++) {
            let opacityVal = (i + 1) / e.trail.length * 0.4;
            // Make the trail radius slightly larger than the entity so it acts like a visible glowing aura
            let radiusVal = e.radius + 8 * (i + 1) / e.trail.length;
            drawCircle({
                pos: e.trail[i].sub(e.pos),
                radius: radiusVal,
                color: e.color,
                opacity: opacityVal,
                anchor: "center"
            });
        }
    });

    onDraw(() => {
        if (isMouseDown("left") && mousePos()) {
            get("element").forEach(e => {
                let d = e.pos.dist(mousePos());
                if (d < 220) {
                    drawDashedLine(e.pos, mousePos(), e.color, 0.4);
                }
            });
        }
    });

    function drawDashedLine(p1, p2, col, opac) {
        const dist = p1.dist(p2);
        const dir = p2.sub(p1).unit();
        const dashLen = 6;
        const gapLen = 4;
        let currDist = 0;
        while (currDist < dist) {
            let endDist = currDist + dashLen;
            if (endDist > dist) endDist = dist;
            drawLine({
                p1: p1.add(dir.scale(currDist)),
                p2: p1.add(dir.scale(endDist)),
                width: 1.5,
                color: col,
                opacity: opac
            });
            currDist += dashLen + gapLen;
        }
    }

    function absorbIronCore(e) {
        createExplosion(e.pos, rgb(255, 215, 0), 40, 4, 12);
        playFusionSound(5);
        score += 1000;
        scoreLabel.text = `SCORE: ${score}`;

        instability = Math.max(0, instability - 25);

        destroy(e);

        const shockRing = add([
            circle(10),
            pos(center),
            anchor("center"),
            color(255, 215, 0),
            opacity(0.8),
            z(-2),
            "shockwave"
        ]);

        shockRing.onUpdate(() => {
            shockRing.radius += dt() * 400;
            shockRing.opacity -= dt() * 1.6;
            if (shockRing.opacity <= 0) {
                destroy(shockRing);
            }
        });
    }

    function crushMismatchedCore(e) {
        createExplosion(e.pos, e.color, 15, 3, 7);
        playFractureSound();

        const dustFromCrush = randi(2, 4);
        for (let i = 0; i < dustFromCrush; i++) {
            const angle = rand(0, Math.PI * 2);
            const vel = vec2(Math.cos(angle) * rand(40, 100), Math.sin(angle) * rand(40, 100));
            spawnSpaceDust(e.pos, vel);
        }

        destroy(e);
    }

    onKeyPress("space", () => {
        if (pulseCooldown <= 0) {
            triggerSingularityPulse();
        }
    });

    function triggerSingularityPulse() {
        pulseCooldown = 30;
        playPulseSound();

        const pulseRing = add([
            circle(20),
            pos(center),
            anchor("center"),
            color(0, 255, 240),
            opacity(0.9),
            z(2)
        ]);

        pulseRing.onUpdate(() => {
            pulseRing.radius += dt() * 700;
            pulseRing.opacity -= dt() * 1.4;

            get("spacedust").forEach(dust => {
                if (dust.pos.dist(center) < pulseRing.radius) {
                    createExplosion(dust.pos, rgb(140, 140, 150), 6, 1, 3);
                    destroy(dust);
                }
            });

            if (pulseRing.opacity <= 0) {
                destroy(pulseRing);
            }
        });
    }

    let spawnTimer = 0;
    onUpdate(() => {
        spawnTimer += dt();
        let currentSpawnInterval = 2.0;
        let allowedTiers = [1];

        if (secondsElapsed >= 180) {
            currentSpawnInterval = 0.8;
            allowedTiers = [1, 2, 3];
        } else if (secondsElapsed >= 60) {
            currentSpawnInterval = 1.2;
            allowedTiers = [1, 2];
        }

        if (spawnTimer >= currentSpawnInterval) {
            spawnTimer = 0;
            const chosenTier = choose(allowedTiers);
            spawnElement(chosenTier);
        }
    });

    function triggerSupernova() {
        stopGravityHum();
        playFractureSound();

        add([
            circle(30),
            pos(center),
            anchor("center"),
            color(255, 255, 255),
            opacity(1.0),
            z(10),
            "supernova_fx"
        ]).onUpdate(function() {
            this.radius += dt() * 1100;
            if (this.radius >= 1000) {
                go("gameover", score, secondsElapsed);
            }
        });
    }
});

scene("gameover", (finalScore, surviveTime) => {
    stopGravityHum();

    if (finalScore > globalHighScore) {
        globalHighScore = finalScore;
    }

    add([
        rect(width(), height()),
        pos(0, 0),
        color(12, 10, 28)
    ]);

    for (let i = 0; i < 30; i++) {
        add([
            pos(rand(0, width()), rand(0, height())),
            circle(rand(1, 3)),
            color(255, 255, 255),
            opacity(rand(0.1, 0.4))
        ]);
    }

    add([
        text("SYSTEM COLLAPSE", { size: 48 }),
        pos(width() / 2, 120),
        anchor("center"),
        color(255, 30, 80)
    ]);

    add([
        text("The Singularity has destabilized into a Supernova.", { size: 16 }),
        pos(width() / 2, 175),
        anchor("center"),
        color(180, 180, 200)
    ]);

    const resultsBox = add([
        rect(400, 150, { rx: 8, ry: 8 }),
        pos(width() / 2, 280),
        anchor("center"),
        color(22, 18, 45),
        outline(1.5, rgb(80, 70, 110))
    ]);

    resultsBox.add([
        text(`FINAL SCORE: ${finalScore}`, { size: 18 }),
        pos(0, -40),
        anchor("center"),
        color(255, 215, 0)
    ]);

    resultsBox.add([
        text(`HIGH SCORE: ${globalHighScore}`, { size: 14 }),
        pos(0, -10),
        anchor("center"),
        color(0, 255, 210)
    ]);

    const minutes = Math.floor(surviveTime / 60);
    const seconds = Math.floor(surviveTime % 60);
    resultsBox.add([
        text(`SURVIVAL TIME: ${minutes}m ${seconds}s`, { size: 15 }),
        pos(0, 30),
        anchor("center"),
        color(200, 200, 230)
    ]);

    const restartBtn = add([
        rect(220, 46, { rx: 8, ry: 8 }),
        pos(width() / 2 - 120, 410),
        anchor("center"),
        color(0, 255, 150),
        area()
    ]);

    restartBtn.add([
        text("STABILIZE AGAIN", { size: 14 }),
        anchor("center"),
        color(0, 0, 0)
    ]);

    restartBtn.onHoverUpdate(() => {
        restartBtn.color = rgb(0, 210, 125);
    });
    restartBtn.onHoverEnd(() => {
        restartBtn.color = rgb(0, 255, 150);
    });
    restartBtn.onClick(() => {
        globalContinueUsed = false;
        go("game");
    });

    const adContinueBtn = add([
        rect(240, 46, { rx: 8, ry: 8 }),
        pos(width() / 2 + 120, 410),
        anchor("center"),
        color(180, 40, 110),
        area()
    ]);

    adContinueBtn.add([
        text(globalContinueUsed ? "SHIELD EXHAUSTED" : "PREVENT COLLAPSE (AD)", { size: 11 }),
        anchor("center"),
        color(255, 255, 255)
    ]);

    if (globalContinueUsed) {
        adContinueBtn.color = rgb(60, 50, 70);
    }

    adContinueBtn.onHoverUpdate(() => {
        if (!globalContinueUsed) {
            adContinueBtn.color = rgb(210, 50, 130);
        }
    });
    adContinueBtn.onHoverEnd(() => {
        if (!globalContinueUsed) {
            adContinueBtn.color = rgb(180, 40, 110);
        }
    });
    adContinueBtn.onClick(() => {
        if (!globalContinueUsed) {
            window.showRewardedAd(() => {
                globalContinueUsed = true;
                go("game");
            });
        }
    });

    const menuBtn = add([
        rect(160, 36, { rx: 6, ry: 6 }),
        pos(width() / 2, 490),
        anchor("center"),
        color(40, 35, 75),
        area()
    ]);

    menuBtn.add([
        text("MAIN MENU", { size: 12 }),
        anchor("center"),
        color(200, 200, 220)
    ]);

    menuBtn.onHoverUpdate(() => {
        menuBtn.color = rgb(60, 50, 105);
    });
    menuBtn.onHoverEnd(() => {
        menuBtn.color = rgb(40, 35, 75);
    });
    menuBtn.onClick(() => {
        globalContinueUsed = false;
        go("menu");
    });

    if (surviveTime >= 60) {
        window.showInterstitialAd();
    }
});

go("menu");