import kaboom from "kaboom";

kaboom({
    width: 1280,
    height: 720,
    letterbox: true,
    background: [20, 0, 30],
});

// Ad hooks
window.showInterstitialAd = () => { console.log("Ad Placeholder: Interstitial Ad Shown"); };
window.showRewardedAd = (rewardCallback) => { 
    console.log("Ad Placeholder: Rewarded Ad Shown"); 
    if (rewardCallback) rewardCallback();
};

scene("menu", () => {
    let soulShards = getData("soulShards") || 0;
    let metaMaxSkeletons = getData("metaMaxSkeletons") || 0;
    let metaSpeedBoost = getData("metaSpeedBoost") || 0;

    add([rect(1280, 720), color(20, 0, 30)]);
    
    // grid
    for(let i=0; i<1280; i+=100) add([rect(1, 720), pos(i,0), color(0, 255, 255), opacity(0.05)]);
    for(let j=0; j<720; j+=100) add([rect(1280, 1), pos(0,j), color(0, 255, 255), opacity(0.05)]);

    add([text("NEON NECROMANCER", { size: 64 }), pos(center().x, 150), anchor("center"), color(255, 0, 128)]);
    add([text(`Soul Shards: ${soulShards}`, { size: 32 }), pos(center().x, 250), anchor("center"), color(0, 255, 255)]);

    // Start Button
    let startBtn = add([rect(240, 60, { radius: 6 }), pos(center().x, 350), anchor("center"), color(0, 255, 128), area()]);
    startBtn.add([text("START RUN", { size: 24 }), anchor("center"), color(0, 0, 0)]);
    
    // Upgrades
    let skelCost = 50 + metaMaxSkeletons * 50;
    let upgSkelBtn = add([rect(340, 60, { radius: 6 }), pos(center().x - 200, 480), anchor("center"), color(200, 100, 255), area()]);
    upgSkelBtn.add([text(`+1 Start Skel (${skelCost} Shards)`, { size: 20 }), anchor("center"), color(0, 0, 0)]);

    let spdCost = 50 + metaSpeedBoost * 50;
    let upgSpdBtn = add([rect(340, 60, { radius: 6 }), pos(center().x + 200, 480), anchor("center"), color(200, 100, 255), area()]);
    upgSpdBtn.add([text(`+Speed (${spdCost} Shards)`, { size: 20 }), anchor("center"), color(0, 0, 0)]);

    let inputReady = false;
    wait(0.2, () => inputReady = true);

    startBtn.onClick(() => { if (inputReady) go("game"); });
    
    upgSkelBtn.onClick(() => {
        if (soulShards >= skelCost) {
            soulShards -= skelCost;
            metaMaxSkeletons++;
            setData("soulShards", soulShards);
            setData("metaMaxSkeletons", metaMaxSkeletons);
            go("menu");
        }
    });

    upgSpdBtn.onClick(() => {
        if (soulShards >= spdCost) {
            soulShards -= spdCost;
            metaSpeedBoost++;
            setData("soulShards", soulShards);
            setData("metaSpeedBoost", metaSpeedBoost);
            go("menu");
        }
    });
});

scene("game", () => {
    let soulShards = getData("soulShards") || 0;
    let metaMaxSkeletons = getData("metaMaxSkeletons") || 0;
    let metaSpeedBoost = getData("metaSpeedBoost") || 0;
    let runShards = 0;

    let playerHp = 100;
    let maxHp = 100;
    let level = 1;
    let xp = 0;
    let xpToLevel = 5;
    let runTime = 0;
    
    let baseSpeed = 250 + (metaSpeedBoost * 20);
    
    let skeletons = [];
    let orbitRadius = 80;
    let orbitSpeed = 3; // radians per sec
    let skelDamage = 1;
    let maxSkeletons = 10 + metaMaxSkeletons;

    // Arena Background
    add([rect(1280, 720), color(20, 0, 30)]);
    for(let i=0; i<1280; i+=100) add([rect(1, 720), pos(i,0), color(255, 0, 128), opacity(0.1)]);
    for(let j=0; j<720; j+=100) add([rect(1280, 1), pos(0,j), color(255, 0, 128), opacity(0.1)]);

    let player = add([
        circle(20),
        pos(center()),
        anchor("center"),
        color(150, 0, 255),
        area(),
        body(),
        "player"
    ]);

    // UI
    let hpBar = add([rect(200, 20), pos(20, 20), color(255, 0, 0), fixed(), z(100)]);
    let hpBarInner = add([rect(200, 20), pos(20, 20), color(0, 255, 0), fixed(), z(101)]);
    let levelText = add([text(`LVL: ${level}`, { size: 24 }), pos(20, 50), color(0, 255, 255), fixed(), z(100)]);
    let xpBar = add([rect(200, 10), pos(20, 80), color(50, 50, 50), fixed(), z(100)]);
    let xpBarInner = add([rect(0, 10), pos(20, 80), color(255, 255, 0), fixed(), z(101)]);
    let timeText = add([text(`TIME: 0`, { size: 24 }), pos(640, 20), anchor("top"), color(255, 0, 128), fixed(), z(100)]);

    function spawnSkeleton() {
        if (skeletons.length >= maxSkeletons) return;
        let skel = add([
            polygon([vec2(0, -15), vec2(10, 10), vec2(-10, 10)]),
            pos(player.pos),
            anchor("center"),
            color(0, 255, 255),
            area(),
            "skeleton",
            { angle: Math.random() * Math.PI * 2 }
        ]);
        skeletons.push(skel);
    }
    
    // Initial skeletons based on meta progression
    for(let i=0; i<metaMaxSkeletons; i++) {
        spawnSkeleton();
    }

    // Traps (Orange crosses / spinning blades)
    function spawnTrap(p) {
        add([
            rect(40, 40),
            pos(p),
            anchor("center"),
            color(255, 100, 0),
            area(),
            "trap",
            { rotSpeed: 100 }
        ]).onUpdate(function() {
            this.angle += this.rotSpeed * dt();
        });
    }
    
    spawnTrap(vec2(300, 200));
    spawnTrap(vec2(980, 200));
    spawnTrap(vec2(300, 520));
    spawnTrap(vec2(980, 520));

    // Enemy Spawner
    let enemySpeed = 100;
    let spawnRate = 2.0;
    
    loop(0.5, () => {
        runTime += 0.5;
        timeText.text = `TIME: ${Math.floor(runTime)}`;
        enemySpeed = 100 + runTime * 0.5;
        spawnRate = Math.max(0.1, 2.0 - (runTime * 0.02));
    });

    let spawnTimer = 0;
    onUpdate(() => {
        spawnTimer += dt();
        if (spawnTimer >= spawnRate) {
            spawnTimer = 0;
            // Spawn at edges
            let p;
            if (chance(0.5)) {
                p = vec2(chance(0.5) ? -50 : 1330, rand(0, 720));
            } else {
                p = vec2(rand(0, 1280), chance(0.5) ? -50 : 770);
            }
            add([
                rect(24, 24, {radius: 4}),
                pos(p),
                anchor("center"),
                color(255, 0, 50),
                area(),
                "enemy",
                { hp: 1 + Math.floor(runTime / 60) } // scales hp slightly
            ]);
        }
    });

    // Enemy AI
    onUpdate("enemy", (e) => {
        if (!e.exists()) return;
        let dir = player.pos.sub(e.pos).unit();
        e.move(dir.scale(enemySpeed));
    });
    
    // Skeleton Orbit
    onUpdate(() => {
        // distribute skeletons evenly
        skeletons = skeletons.filter(s => s.exists()); // cleanup
        let len = skeletons.length;
        for (let i = 0; i < len; i++) {
            let skel = skeletons[i];
            let targetAngle = (time() * orbitSpeed) + (i * (Math.PI * 2 / len));
            skel.pos.x = player.pos.x + Math.cos(targetAngle) * orbitRadius;
            skel.pos.y = player.pos.y + Math.sin(targetAngle) * orbitRadius;
            
            // Draw trail
            add([
                circle(4),
                pos(skel.pos),
                color(0, 255, 255),
                opacity(0.5),
                lifespan(0.1, { fade: 0.1 })
            ]);
        }
    });

    // Collisions
    player.onCollide("enemy", (e) => {
        playerHp -= 10;
        shake(10);
        destroy(e);
        checkDeath();
    });

    onCollide("skeleton", "enemy", (s, e) => {
        e.hp -= skelDamage;
        e.color = rgb(255, 255, 255);
        wait(0.1, () => { if(e.exists()) e.color = rgb(255, 0, 50); });
        
        if (e.hp <= 0) {
            enemyDie(e);
        }
    });

    onCollide("enemy", "trap", (e, t) => {
        enemyDie(e);
    });

    function enemyDie(e) {
        // Particles
        for(let i=0; i<10; i++) {
            add([
                rect(6, 6),
                pos(e.pos),
                color(255, 0, 128),
                move(vec2(rand(-1, 1), rand(-1, 1)), rand(100, 300)),
                lifespan(0.5, { fade: 0.5 })
            ]);
        }
        
        // Spawn XP
        add([
            polygon([vec2(0, -6), vec2(6, 0), vec2(0, 6), vec2(-6, 0)]),
            pos(e.pos),
            anchor("center"),
            color(255, 255, 0),
            area(),
            "xp"
        ]);
        
        // Maybe spawn skeleton if missing
        if (skeletons.length < maxSkeletons) {
            spawnSkeleton();
        }
        
        destroy(e);
    }

    player.onCollide("xp", (x) => {
        destroy(x);
        xp += 1;
        runShards += 1; 
        checkLevelUp();
    });

    function checkDeath() {
        if (playerHp <= 0) {
            soulShards += runShards;
            setData("soulShards", soulShards);
            go("gameover", { runShards: runShards, time: Math.floor(runTime) });
        }
    }

    function checkLevelUp() {
        if (xp >= xpToLevel) {
            xp -= xpToLevel;
            level++;
            xpToLevel = Math.floor(xpToLevel * 1.5);
            levelText.text = `LVL: ${level}`;
            shake(15);
            
            let upgrades = ["+2 MAX SKELETONS", "+ORBIT RADIUS", "+ORBIT SPEED", "+30 HEAL"];
            let choice = randi(0, 4); // 0, 1, 2, 3
            if (choice === 0) maxSkeletons += 2;
            else if (choice === 1) orbitRadius += 20;
            else if (choice === 2) orbitSpeed += 1;
            else {
                playerHp = Math.min(maxHp, playerHp + 30);
            }

            add([
                text(upgrades[choice], { size: 24 }),
                pos(player.pos.x, player.pos.y - 40),
                anchor("center"),
                color(255, 255, 0),
                move(UP, 50),
                lifespan(2, { fade: 0.5 })
            ]);
        }
    }

    // Input & Movement
    onUpdate(() => {
        let dir = vec2(0, 0);
        if (isKeyDown("left") || isKeyDown("a")) dir.x -= 1;
        if (isKeyDown("right") || isKeyDown("d")) dir.x += 1;
        if (isKeyDown("up") || isKeyDown("w")) dir.y -= 1;
        if (isKeyDown("down") || isKeyDown("s")) dir.y += 1;
        
        if (dir.x !== 0 || dir.y !== 0) {
            dir = dir.unit();
            player.move(dir.scale(baseSpeed));
            
            // Keep in bounds
            if (player.pos.x < 20) player.pos.x = 20;
            if (player.pos.x > 1260) player.pos.x = 1260;
            if (player.pos.y < 20) player.pos.y = 20;
            if (player.pos.y > 700) player.pos.y = 700;
        }

        // update UI
        hpBarInner.width = 200 * (playerHp / maxHp);
        xpBarInner.width = 200 * (xp / xpToLevel);
    });
});

scene("gameover", (data) => {
    add([rect(1280, 720), color(20, 0, 30)]);
    add([text("YOU DIED", { size: 80 }), pos(center().x, 200), anchor("center"), color(255, 0, 0)]);
    add([text(`Survived: ${data.time}s`, { size: 32 }), pos(center().x, 320), anchor("center"), color(255, 255, 255)]);
    add([text(`Shards Collected: ${data.runShards}`, { size: 32 }), pos(center().x, 380), anchor("center"), color(0, 255, 255)]);
    
    let btn = add([rect(240, 60, {radius: 8}), pos(center().x, 500), anchor("center"), color(0, 255, 128), area()]);
    btn.add([text("MAIN MENU", {size: 24}), anchor("center"), color(0,0,0)]);
    
    btn.onClick(() => {
        window.showInterstitialAd();
        go("menu");
    });

    let btnAd = add([rect(240, 60, {radius: 8}), pos(center().x, 580), anchor("center"), color(255, 0, 128), area()]);
    btnAd.add([text("WATCH AD (x2 Shards)", {size: 16}), anchor("center"), color(0,0,0)]);

    let adWatched = false;
    btnAd.onClick(() => {
        if (adWatched) return;
        window.showRewardedAd(() => {
            adWatched = true;
            let currentShards = getData("soulShards") || 0;
            setData("soulShards", currentShards + data.runShards); // Add again
            btnAd.color = rgb(100, 100, 100);
            btnAd.children[0].text = "REWARD CLAIMED";
        });
    });
});

go("menu");