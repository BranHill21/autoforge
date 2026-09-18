import kaboom from "kaboom";

kaboom({
    width: 1280,
    height: 720,
    letterbox: true,
    background: [10, 10, 15],
});

// Ad hook globals
window.showInterstitialAd = () => { console.log("Ad Placeholder: Interstitial Ad Shown"); };
window.showRewardedAd = (rewardCallback) => { 
    console.log("Ad Placeholder: Rewarded Ad Shown"); 
    if (rewardCallback) rewardCallback();
};

scene("menu", () => {
    // CRT scanline / ambient background effect
    add([
        rect(1280, 720),
        color(15, 20, 25),
        pos(0, 0),
    ]);

    // Title
    add([
        text("SUBTERRANEAN CLINIC", { size: 64 }),
        pos(center().x, 150),
        anchor("center"),
        color(0, 255, 128),
    ]);

    add([
        text("Manage illicit organ grafts, satisfy clientele, evade the law.", { size: 24 }),
        pos(center().x, 230),
        anchor("center"),
        color(150, 200, 180),
    ]);

    // Instructions box
    add([
        rect(800, 200, { radius: 8 }),
        pos(center().x, 370),
        anchor("center"),
        color(25, 35, 45),
        area(),
    ]);

    add([
        text("HOW TO PLAY:\n1. Drag organs from the Vat onto matching client surgery slots.\n2. Keep Patient Stability high & beat the timer.\n3. Avoid high Police Heat or it's game over!\n4. Use upgrades to unlock advanced gene-splicing.", { size: 18 }),
        pos(center().x, 370),
        anchor("center"),
        color(200, 220, 210),
    ]);

    // Start Button
    const startBtn = add([
        rect(300, 60, { radius: 8 }),
        pos(center().x, 530),
        anchor("center"),
        color(0, 180, 90),
        area(),
    ]);
    startBtn.add([
        text("OPEN CLINIC", { size: 28 }),
        anchor("center"),
        color(255, 255, 255),
    ]);

    let inputReady = false;
    wait(0.2, () => { inputReady = true; });

    startBtn.onClick(() => {
        if (!inputReady) return;
        go("game", { credits: 100, heat: 0, reputation: 10, shift: 1 });
    });
    
    startBtn.onHoverUpdate(() => {
        startBtn.color = rgb(0, 220, 110);
    });
    startBtn.onHoverEnd(() => {
        startBtn.color = rgb(0, 180, 90);
    });
});

scene("game", (data) => {
    // Game State
    let credits = data.credits || 100;
    let heat = data.heat || 0;
    let reputation = data.reputation || 10;
    let shift = data.shift || 1;
    let clientsServed = 0;
    let maxClientsPerShift = 5;

    // Background clinic theme
    add([
        rect(1280, 720),
        color(20, 15, 25),
        pos(0, 0),
    ]);

    // HUD Header
    add([
        rect(1280, 60),
        color(10, 10, 15),
        pos(0, 0),
        fixed(),
        z(100),
    ]);

    add([
        text(`Credits: $${credits}`, { size: 22 }),
        pos(30, 20),
        fixed(),
        z(101),
        color(0, 255, 120),
    ]);

    const heatLabel = add([
        text(`Police Heat: ${heat}%`, { size: 22 }),
        pos(300, 20),
        fixed(),
        z(101),
        color(255, 80, 80),
    ]);

    add([
        text(`Reputation: ${reputation}`, { size: 22 }),
        pos(600, 20),
        fixed(),
        z(101),
        color(220, 220, 100),
    ]);

    add([
        text(`Shift: ${shift} | Client: ${clientsServed + 1}/${maxClientsPerShift}`, { size: 22 }),
        pos(900, 20),
        fixed(),
        z(101),
        color(100, 200, 255),
    ]);

    // Vat / Inventory Area (Left side)
    add([
        rect(380, 600, { radius: 10 }),
        pos(40, 90),
        color(30, 40, 50),
        area(),
    ]);
    add([
        text("BIOMATTER VAT", { size: 20 }),
        pos(60, 110),
        color(150, 200, 220),
        fixed(),
        z(10),
    ]);

    // Operating Table Area (Right side)
    add([
        rect(800, 600, { radius: 10 }),
        pos(450, 90),
        color(25, 30, 35),
        area(),
    ]);
    add([
        text("OPERATING TABLE", { size: 20 }),
        pos(470, 110),
        color(220, 150, 150),
        fixed(),
        z(10),
    ]);

    // Patient & Requirements State
    let patientStability = 100;
    let surgeryTimeLeft = 30; // 30 seconds per client
    let requiredOrgans = ["Heart", "Liver", "Kidney"];
    if (shift >= 2) requiredOrgans.push("Synthetic Core");

    let placedOrgans = {};
    let roundEnded = false;

    // Stability & Timer bar UI
    add([
        rect(400, 24, { radius: 4 }),
        pos(480, 150),
        color(50, 20, 20),
    ]);
    const stabilityBar = add([
        rect(400, 24, { radius: 4 }),
        pos(480, 150),
        color(255, 60, 60),
    ]);
    const stabilityText = add([
        text("Stability: 100%", { size: 16 }),
        pos(490, 154),
        z(10),
        color(255, 255, 255),
    ]);

    const timerText = add([
        text("Time: 30.0s", { size: 20 }),
        pos(1000, 150),
        color(255, 255, 200),
    ]);

    // Client Demand Text
    let demandStr = "Client Demands:\n" + requiredOrgans.map(o => ` - ${o}`).join("\n");
    add([
        text(demandStr, { size: 18 }),
        pos(480, 200),
        color(200, 220, 220),
    ]);

    // Surgery Slots UI
    requiredOrgans.forEach((org, idx) => {
        let slotPos = vec2(500 + (idx % 2) * 360, 340 + Math.floor(idx / 2) * 120);

        add([
            rect(340, 100, { radius: 8 }),
            pos(slotPos),
            color(40, 50, 60),
            area(),
            "surgery_slot",
            { targetOrgan: org, filled: false }
        ]);

        add([
            text(`Slot: ${org}`, { size: 16 }),
            pos(slotPos.x + 15, slotPos.y + 15),
            color(150, 170, 180),
            z(5),
        ]);
    });

    // Spawn Organ Items in Vat - ENSURE ALL REQUIRED ORGANS ARE GUARANTEED TO SPAWN
    let vatItems = [];

    function spawnVatOrgan(name, index) {
        let posVec = vec2(70 + (index % 2) * 170, 160 + Math.floor(index / 2) * 90);
        let organObj = add([
            rect(150, 70, { radius: 6 }),
            pos(posVec),
            color(70, 110, 90),
            area(),
            anchor("topleft"),
            "vat_organ",
            { organName: name, originalPos: posVec, isDragging: false }
        ]);

        organObj.add([
            text(name, { size: 14 }),
            pos(10, 10),
            color(255, 255, 255),
        ]);

        vatItems.push(organObj);
    }

    // Fixed Pool generation: Guarantee required organs are present in the vat so the round is never unwinnable
    let availableOrgansInVat = [...requiredOrgans, "Lung", "Neural Node"];
    // Ensure we fill up to 6 slots securely without exceeding grid size
    while(availableOrgansInVat.length < 6) {
        availableOrgansInVat.push("Kidney");
    }

    for (let i = 0; i < 6; i++) {
        let name = availableOrgansInVat[i];
        spawnVatOrgan(name, i);
    }

    // Drag and Drop Logic
    let activeDragItem = null;

    onMousePress(() => {
        if (roundEnded) return;
        let mPos = mousePos();
        for (let item of vatItems) {
            if (!item.exists()) continue;
            if (item.hasPoint(mPos)) {
                activeDragItem = item;
                item.isDragging = true;
                break;
            }
        }
    });

    onUpdate(() => {
        if (roundEnded) return;

        if (activeDragItem && activeDragItem.exists()) {
            let mPos = mousePos();
            activeDragItem.pos = mPos;
        }

        // Timer decrement
        surgeryTimeLeft -= dt();
        timerText.text = `Time: ${Math.max(0, surgeryTimeLeft).toFixed(1)}s`;

        // Patient stability decay based on time & missing organs
        patientStability -= dt() * 1.5;
        if (patientStability < 0) patientStability = 0;

        stabilityBar.width = Math.max(0, (patientStability / 100) * 400);
        stabilityText.text = `Stability: ${Math.floor(patientStability)}%`;

        if (patientStability <= 0 || surgeryTimeLeft <= 0) {
            roundEnded = true;
            go("gameover", { reason: "Patient Flatlined / Critical Failure", credits, heat, reputation, shift });
        }
    });

    onMouseRelease(() => {
        if (roundEnded || !activeDragItem || !activeDragItem.exists()) return;

        let droppedOnValidSlot = false;
        let mPos = mousePos();

        let slots = get("surgery_slot");
        for (let slot of slots) {
            if (slot.hasPoint(mPos)) {
                if (activeDragItem.organName === slot.targetOrgan && !slot.filled) {
                    slot.filled = true;
                    droppedOnValidSlot = true;

                    slot.color = rgb(40, 120, 60);
                    slot.add([
                        text("GRAFTED", { size: 16 }),
                        pos(20, 40),
                        color(100, 255, 150),
                        z(10),
                    ]);

                    placedOrgans[slot.targetOrgan] = true;
                    destroy(activeDragItem);
                    
                    let allDone = requiredOrgans.every(o => placedOrgans[o]);
                    if (allDone) {
                        roundEnded = true;
                        let earned = 150 + shift * 25;
                        credits += earned;
                        reputation += 3;
                        heat += 8;

                        wait(0.8, () => {
                            clientsServed++;
                            if (clientsServed >= maxClientsPerShift) {
                                window.showInterstitialAd();
                                go("shift_summary", { credits, heat, reputation, shift: shift + 1 });
                            } else {
                                go("game", { credits, heat, reputation, shift });
                            }
                        });
                    }
                    break;
                }
            }
        }

        if (!droppedOnValidSlot) {
            activeDragItem.pos = activeDragItem.originalPos;
        }

        activeDragItem.isDragging = false;
        activeDragItem = null;
    });

    // Emergency Bribe / Rewarded Ad Button to lower heat
    const bribeBtn = add([
        rect(220, 40, { radius: 6 }),
        pos(1020, 650),
        color(180, 120, 40),
        area(),
        fixed(),
        z(150),
    ]);
    bribeBtn.add([text("Bribe Inspector (Ad)", { size: 14 }), pos(15, 12), color(255,255,255)]);

    bribeBtn.onClick(() => {
        if (roundEnded) return;
        window.showRewardedAd(() => {
            heat = Math.max(0, heat - 35);
            heatLabel.text = `Police Heat: ${heat}%`;
        });
    });
});

scene("shift_summary", (data) => {
    add([
        rect(1280, 720),
        color(15, 25, 20),
        pos(0, 0),
    ]);

    add([
        text(`SHIFT ${data.shift - 1} COMPLETED`, { size: 48 }),
        pos(center().x, 150),
        anchor("center"),
        color(0, 255, 150),
    ]);

    add([
        text(`Credits Acquired: $${data.credits}\nReputation: ${data.reputation}\nPolice Heat: ${data.heat}%`, { size: 24 }),
        pos(center().x, 280),
        anchor("center"),
        color(200, 220, 210),
    ]);

    const nextBtn = add([
        rect(300, 60, { radius: 8 }),
        pos(center().x, 480),
        anchor("center"),
        color(0, 180, 90),
        area(),
    ]);
    nextBtn.add([text("START NEXT SHIFT", { size: 22 }), anchor("center"), color(255, 255, 255)]);

    nextBtn.onClick(() => {
        if (data.heat >= 100) {
            go("gameover", { reason: "Police Raid! Clinic Shut Down.", credits: data.credits, heat: data.heat, reputation: data.reputation, shift: data.shift });
        } else {
            go("game", { credits: data.credits, heat: data.heat, reputation: data.reputation, shift: data.shift });
        }
    });
});

scene("gameover", (data) => {
    window.showInterstitialAd();

    add([
        rect(1280, 720),
        color(30, 10, 10),
        pos(0, 0),
    ]);

    add([
        text("DISPOSED OF (GAME OVER)", { size: 52 }),
        pos(center().x, 150),
        anchor("center"),
        color(255, 60, 60),
    ]);

    add([
        text(`Reason: ${data.reason}\nFinal Credits: $${data.credits}\nShift Reached: ${data.shift}`, { size: 24 }),
        pos(center().x, 280),
        anchor("center"),
        color(220, 180, 180),
    ]);

    // Legacy Prestige button
    const prestigeBtn = add([
        rect(350, 60, { radius: 8 }),
        pos(center().x, 440),
        anchor("center"),
        color(140, 60, 180),
        area(),
    ]);
    prestigeBtn.add([text("HARVEST BRAIN (PRESTIGE)", { size: 20 }), anchor("center"), color(255, 255, 255)]);

    prestigeBtn.onClick(() => {
        go("menu");
    });

    const menuBtn = add([
        rect(300, 50, { radius: 8 }),
        pos(center().x, 530),
        anchor("center"),
        color(80, 80, 90),
        area(),
    ]);
    menuBtn.add([text("Main Menu", { size: 20 }), anchor("center"), color(255, 255, 255)]);

    menuBtn.onClick(() => {
        go("menu");
    });
});

go("menu");