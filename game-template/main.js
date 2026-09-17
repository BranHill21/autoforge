import kaboom from 'kaboom';

kaboom();

// No external assets needed; using Kaboom primitives

const gameLevel = () => {
  let score = 0;

  add([
    rect(30, 30),
    color(0, 255, 255),
    pos(100, 100),
    anchor("center"),
    scale(2),
    area(),
    body(),
    "player",
  ]);

  const hazards = [];
  const spawnRate = 100;
  const hazardSpeed = 200;
  let spawnTimer = 0;

  function spawnHazard() {
    const hazard = add([
      rect(20, 20),
      pos(width(), rand(height())),
      color(255, 0, 0),
      area(),
      "hazard",
      { speed: hazardSpeed },
    ]);
    hazards.push(hazard);
  }

  function updateHazards() {
    spawnTimer++;
    if (spawnTimer >= spawnRate) {
      spawnHazard();
      spawnTimer = 0;
    }

    for (let i = hazards.length - 1; i >= 0; i--) {
      const hazard = hazards[i];
      hazard.pos.x -= hazard.speed * dt();
      if (hazard.pos.x < -20) {
        destroy(hazard);
        hazards.splice(i, 1);
      }
    }
  }

  function checkCollisions() {
    const players = get("player");
    if (!players || players.length === 0) return;
    const spark = players[0];
    
    for (let i = hazards.length - 1; i >= 0; i--) {
      const hazard = hazards[i];
      
      if (spark.isColliding(hazard)) {
        score++;
        destroy(hazard);
        hazards.splice(i, 1);
      }
    }
  }

  return {
    update: () => {
      updateHazards();
      checkCollisions();
    },
    getScore: () => score
  };
};

scene("game", () => {
  const game = gameLevel();
  
  const scoreText = add([
    text("Score: 0", { size: 24 }),
    anchor("topleft"),
    pos(10, 10),
  ]);

  onUpdate(() => {
    game.update();
    scoreText.text = "Score: " + game.getScore();
  });
});

go("game");
