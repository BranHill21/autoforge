import kaboom from 'kaboom';

kaboom({
  width: 800,
  height: 600,
  background: [ 10, 10, 20 ],
});

// Set gravity
setGravity(1600);

scene("start", () => {
    add([
        text("P U L S A R", { size: 64 }),
        pos(width()/2, height()/2 - 50),
        anchor("center"),
    ]);

    add([
        text("Press SPACE to start", { size: 24 }),
        pos(width()/2, height()/2 + 50),
        anchor("center"),
    ]);

    add([
        text("Controls: SPACE to jump. Avoid falling and red blocks.", { size: 16 }),
        pos(width()/2, height() - 50),
        anchor("center"),
    ]);

    onKeyPress("space", () => {
        go("game");
    });
});

scene("game", () => {
    let score = 0;

    const scoreLabel = add([
        text(score, { size: 32 }),
        pos(24, 24),
    ]);

    const player = add([
        rect(32, 32),
        color(0, 255, 0),
        pos(80, 40),
        area(),
        body(),
        "player"
    ]);

    // Floor
    add([
        rect(width(), 48),
        pos(0, height() - 48),
        outline(4),
        area(),
        body({ isStatic: true }),
        color(100, 100, 100),
    ]);

    onKeyPress("space", () => {
        if (player.isGrounded()) {
            player.jump(600);
        }
    });

    // Spawn obstacles
    function spawnObstacle() {
        add([
            rect(48, rand(32, 96)),
            area(),
            outline(4),
            pos(width(), height() - 48),
            anchor("botleft"),
            color(255, 0, 0),
            move(LEFT, 300),
            "obstacle",
        ]);
        wait(rand(1.5, 2.5), spawnObstacle);
    }
    spawnObstacle();

    player.onCollide("obstacle", () => {
        go("lose", score);
    });

    player.onUpdate(() => {
        if (player.pos.y >= height()) {
            go("lose", score);
        }
    });

    onUpdate(() => {
        score++;
        scoreLabel.text = Math.floor(score / 10);
    });
});

scene("lose", (score) => {
    add([
        text("GAME OVER", { size: 64 }),
        pos(width()/2, height()/2 - 50),
        anchor("center"),
    ]);

    add([
        text(`Score: ${Math.floor(score/10)}`, { size: 32 }),
        pos(width()/2, height()/2 + 20),
        anchor("center"),
    ]);

    add([
        text("Press SPACE to restart", { size: 24 }),
        pos(width()/2, height()/2 + 80),
        anchor("center"),
    ]);

    onKeyPress("space", () => {
        go("game");
    });
});

// Start with the start menu
go("start");