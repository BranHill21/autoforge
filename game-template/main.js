import kaboom from "kaboom";

kaboom({
    width: 1280,
    height: 720,
    letterbox: true,
    background: [26, 26, 29],
});

// Ad hooks
window.showInterstitialAd = () => { console.log("Ad Placeholder: Interstitial Ad Shown"); };
window.showRewardedAd = (rewardCallback) => { 
    console.log("Ad Placeholder: Rewarded Ad Shown"); 
    if (rewardCallback) rewardCallback();
};

const COLOR_BG = rgb(26, 26, 29);
const COLOR_LINE = rgb(255, 255, 255);
const COLOR_ACCENT = rgb(0, 255, 170); // Mint green
const COLOR_RED = rgb(255, 100, 100);

setGravity(1000);

// Global State
let stardust = getData("stardust") || 0;
let metaCoreHpBoost = getData("metaCoreHpBoost") || 0;

scene("menu", () => {
    add([rect(1280, 720), color(COLOR_BG)]);
    add([text("KINETIC DROP", { size: 80 }), pos(center().x, 200), anchor("center"), color(COLOR_LINE)]);
    add([text(`Stardust: ${stardust}`, { size: 32 }), pos(center().x, 300), anchor("center"), color(COLOR_ACCENT)]);

    let startBtn = add([rect(240, 60, { radius: 8 }), pos(center().x, 400), anchor("center"), color(COLOR_ACCENT), area()]);
    startBtn.add([text("START RUN", { size: 24 }), anchor("center"), color(COLOR_BG)]);

    let hpCost = 100 + metaCoreHpBoost * 50;
    let upgBtn = add([rect(340, 60, { radius: 8 }), pos(center().x, 500), anchor("center"), color(COLOR_LINE), area()]);
    upgBtn.add([text(`+10 Core HP (${hpCost} SD)`, { size: 20 }), anchor("center"), color(COLOR_BG)]);

    let inputReady = false;
    wait(0.2, () => inputReady = true);

    startBtn.onClick(() => { if (inputReady) go("game", { wave: 1, scrap: 0, upgrades: {} }); });

    upgBtn.onClick(() => {
        if (stardust >= hpCost) {
            stardust -= hpCost;
            metaCoreHpBoost++;
            setData("stardust", stardust);
            setData("metaCoreHpBoost", metaCoreHpBoost);
            go("menu");
        }
    });
});

scene("shop", (data) => {
    add([rect(1280, 720), color(COLOR_BG)]);
    add([text("UPGRADE HANGAR", { size: 60 }), pos(center().x, 100), anchor("center"), color(COLOR_LINE)]);
    add([text(`Scrap: ${data.scrap}`, { size: 40 }), pos(center().x, 200), anchor("center"), color(COLOR_ACCENT)]);

    let orbCount = data.upgrades.orbCount || 1;
    let orbDmg = data.upgrades.orbDmg || 1;
    let bounciness = data.upgrades.bounciness || 0.6;

    let costCount = orbCount * 50;
    let costDmg = orbDmg * 50;

    let btnCount = add([rect(300, 60, {radius:8}), pos(center().x - 200, 350), anchor("center"), color(COLOR_LINE), area()]);
    btnCount.add([text(`+1 Orb Drop (${costCount} Scrap)`, {size: 16}), anchor("center"), color(COLOR_BG)]);

    let btnDmg = add([rect(300, 60, {radius:8}), pos(center().x + 200, 350), anchor("center"), color(COLOR_LINE), area()]);
    btnDmg.add([text(`+1 Orb Dmg (${costDmg} Scrap)`, {size: 16}), anchor("center"), color(COLOR_BG)]);

    let btnNext = add([rect(240, 60, {radius:8}), pos(center().x, 500), anchor("center"), color(COLOR_ACCENT), area()]);
    btnNext.add([text(`NEXT WAVE`, {size: 24}), anchor("center"), color(COLOR_BG)]);

    let inputReady = false;
    wait(0.2, () => inputReady = true);

    btnCount.onClick(() => {
        if (inputReady && data.scrap >= costCount) {
            data.scrap -= costCount;
            data.upgrades.orbCount = orbCount + 1;
            go("shop", data);
        }
    });

    btnDmg.onClick(() => {
        if (inputReady && data.scrap >= costDmg) {
            data.scrap -= costDmg;
            data.upgrades.orbDmg = orbDmg + 1;
            go("shop", data);
        }
    });

    btnNext.onClick(() => {
        if (inputReady) go("game", { wave: data.wave + 1, scrap: data.scrap, upgrades: data.upgrades });
    });

    let btnAd = add([rect(240, 60, {radius: 8}), pos(center().x, 600), anchor("center"), color(100, 100, 100), area()]);
    btnAd.add([text("WATCH AD (+100 Scrap)", {size: 16}), anchor("center"), color(COLOR_LINE)]);
    
    let adWatched = false;
    btnAd.onClick(() => {
        if (!adWatched) {
            window.showRewardedAd(() => {
                adWatched = true;
                data.scrap += 100;
                go("shop", data);
            });
        }
    });
});

scene("game", (data) => {
    if (!data.upgrades) data.upgrades = { orbCount: 1, orbDmg: 1, bounciness: 0.6 };
    
    let wave = data.wave || 1;
    let scrap = data.scrap || 0;
    let coreHp = 100 + metaCoreHpBoost * 10;
    let maxCoreHp = coreHp;

    let enemiesRemaining = 10 + wave * 5;
    let totalEnemies = enemiesRemaining;

    let dropCooldown = 0;
    
    add([rect(1280, 720), color(COLOR_BG)]);
    
    // Core at the bottom
    let core = add([
        rect(1280, 50),
        pos(0, 670),
        color(COLOR_BG),
        outline(4, COLOR_LINE),
        area(),
        body({ isStatic: true }),
        "core"
    ]);
    
    // Pegs scattered around
    for(let i=0; i<15; i++) {
        add([
            circle(10),
            pos(rand(100, 1180), rand(200, 550)),
            anchor("center"),
            color(COLOR_BG),
            outline(3, COLOR_LINE),
            area(),
            body({ isStatic: true }),
            "peg"
        ]);
    }

    // Walls
    add([rect(20, 720), pos(-20, 0), area(), body({ isStatic: true }), "wall"]);
    add([rect(20, 720), pos(1280, 0), area(), body({ isStatic: true }), "wall"]);

    // UI
    let uiWave = add([text(`WAVE: ${wave}`, { size: 32 }), pos(20, 20), color(COLOR_LINE), fixed(), z(100)]);
    let uiScrap = add([text(`SCRAP: ${scrap}`, { size: 32 }), pos(20, 60), color(COLOR_ACCENT), fixed(), z(100)]);
    let uiEnemies = add([text(`ENEMIES: ${enemiesRemaining}`, { size: 32 }), pos(1260, 20), anchor("topright"), color(COLOR_LINE), fixed(), z(100)]);
    let uiCoreHp = add([text(`CORE HP: ${coreHp}/${maxCoreHp}`, { size: 32 }), pos(1260, 60), anchor("topright"), color(COLOR_LINE), fixed(), z(100)]);
    
    // Orbital Cannon
    let cannon = add([
        rect(40, 20),
        pos(center().x, 50),
        anchor("center"),
        color(COLOR_ACCENT),
        z(50)
    ]);

    onUpdate(() => {
        let mx = mousePos().x;
        cannon.pos.x = Math.max(50, Math.min(mx, 1230));
        if (dropCooldown > 0) dropCooldown -= dt();
    });

    onClick(() => {
        if (dropCooldown <= 0) {
            dropCooldown = 1.0; 
            for (let i = 0; i < data.upgrades.orbCount; i++) {
                wait(i * 0.1, () => {
                    let orb = add([
                        circle(12),
                        pos(cannon.pos.x, cannon.pos.y + 20),
                        anchor("center"),
                        color(COLOR_ACCENT),
                        area(),
                        body({ bounce: data.upgrades.bounciness }),
                        "orb"
                    ]);
                });
            }
        }
    });

    // Enemy Spawner
    let spawnTimer = 0;
    onUpdate(() => {
        if (enemiesRemaining > 0) {
            spawnTimer += dt();
            if (spawnTimer > Math.max(0.2, 2.0 - (wave * 0.1))) {
                spawnTimer = 0;
                enemiesRemaining--;
                uiEnemies.text = `ENEMIES: ${enemiesRemaining}`;
                
                add([
                    polygon([vec2(0, 15), vec2(-15, -15), vec2(15, -15)]),
                    pos(rand(100, 1180), -50),
                    anchor("center"),
                    color(COLOR_BG),
                    outline(3, COLOR_RED),
                    area(),
                    "enemy",
                    { hp: 1 + Math.floor(wave / 3), speed: rand(30, 60) + wave * 2, id: rand(0, 100) }
                ]);
            }
        } else {
            let aliveEnemies = get("enemy");
            if (aliveEnemies.length === 0) {
                go("shop", { wave: wave, scrap: scrap, upgrades: data.upgrades });
            }
        }
    });

    onUpdate("enemy", (e) => {
        if (!e.exists()) return;
        e.pos.y += e.speed * dt();
        e.pos.x += Math.sin(time() * 2 + e.id) * 20 * dt();
    });

    onCollide("orb", "peg", (o, p) => {
        // Simple manual bounce simulation
        let dir = o.pos.sub(p.pos).unit();
        o.pos = o.pos.add(dir.scale(5)); // push out
        if (dir.y < 0) o.jump(rand(200, 350));
        else o.jump(rand(100, 200));
        
        // Random horizontal nudge
        o.pos.x += rand(-10, 10);
    });

    onCollide("orb", "wall", (o, w) => {
        // bounce off wall
        o.jump(rand(100, 200));
        if (o.pos.x < 640) o.pos.x += 10;
        else o.pos.x -= 10;
    });

    onCollide("orb", "enemy", (o, e) => {
        playHitJuice(e.pos);
        e.hp -= data.upgrades.orbDmg;
        if (e.hp <= 0) {
            spawnScrap(e.pos);
            destroy(e);
            shake(5);
        } else {
            e.color = COLOR_LINE;
            wait(0.1, () => { if(e.exists()) e.color = COLOR_BG; });
        }
        
        if (o.isGrounded() || true) {
            o.jump(400); 
        }
    });

    onCollide("enemy", "core", (e, c) => {
        destroy(e);
        coreHp -= 10;
        uiCoreHp.text = `CORE HP: ${coreHp}/${maxCoreHp}`;
        shake(10);
        c.color = COLOR_RED;
        wait(0.1, () => { if(c.exists()) c.color = COLOR_BG; });
        
        if (coreHp <= 0) {
            let totalScore = (wave - 1) * 100 + scrap;
            stardust += Math.floor(totalScore / 10);
            setData("stardust", stardust);
            go("gameover", { wave: wave, score: totalScore });
        }
    });
    
    onUpdate("orb", (o) => {
        if (o.pos.y > 750) destroy(o);
    });

    onUpdate("enemy", (e) => {
        if (e.pos.y > 800) destroy(e);
    });

    function playHitJuice(p) {
        add([
            circle(15),
            pos(p),
            anchor("center"),
            color(COLOR_LINE),
            lifespan(0.1, { fade: 0.1 })
        ]);
    }

    function spawnScrap(p) {
        let s = add([
            rect(10, 10, { radius: 2 }),
            pos(p),
            anchor("center"),
            color(COLOR_ACCENT),
            area(),
            "scrap_item",
            body(),
            { collected: false }
        ]);
        s.jump(rand(200, 400));
        
        wait(1.0, () => {
            if (s.exists()) {
                s.collected = true;
                s.unuse("body");
            }
        });
    }
    
    onUpdate("scrap_item", (s) => {
        if (s.collected) {
            let dir = uiScrap.pos.sub(s.pos).unit();
            s.move(dir.scale(800));
            if (s.pos.dist(uiScrap.pos) < 20) {
                scrap += 10;
                uiScrap.text = `SCRAP: ${scrap}`;
                destroy(s);
            }
        }
    });
});

scene("gameover", (data) => {
    add([rect(1280, 720), color(COLOR_BG)]);
    add([text("CORE BREACHED", { size: 80 }), pos(center().x, 200), anchor("center"), color(COLOR_RED)]);
    add([text(`Wave Reached: ${data.wave}`, { size: 32 }), pos(center().x, 320), anchor("center"), color(COLOR_LINE)]);
    add([text(`Score: ${data.score}`, { size: 32 }), pos(center().x, 380), anchor("center"), color(COLOR_ACCENT)]);
    
    let btn = add([rect(240, 60, {radius: 8}), pos(center().x, 500), anchor("center"), color(COLOR_LINE), area()]);
    btn.add([text("MAIN MENU", {size: 24}), anchor("center"), color(COLOR_BG)]);
    
    let inputReady = false;
    wait(0.5, () => inputReady = true);

    btn.onClick(() => {
        if (inputReady) {
            window.showInterstitialAd();
            go("menu");
        }
    });
    
    let btnAd = add([rect(240, 60, {radius: 8}), pos(center().x, 580), anchor("center"), color(100, 100, 100), area()]);
    btnAd.add([text("REVIVE (Watch Ad)", {size: 16}), anchor("center"), color(COLOR_LINE)]);

    let adWatched = false;
    btnAd.onClick(() => {
        if (!adWatched && inputReady) {
            window.showRewardedAd(() => {
                adWatched = true;
                stardust += data.score; 
                setData("stardust", stardust);
                btnAd.color = rgb(50, 50, 50);
                btnAd.children[0].text = "REWARD CLAIMED";
            });
        }
    });
});

go("menu");