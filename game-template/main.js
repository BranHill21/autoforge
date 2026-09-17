import kaboom from 'kaboom';

kaboom();

loadSprite("spark", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIA..." crossorigin="anonymous");

const gameLevel = () => {
  add([
    sprite("spark"),
    pos(100, 100),
    origin("center"),
    scale(2),
    body(),
    "player",
  ]);

  const hazards = [];
  const spawnRate = 100;
  const hazardSpeed = 200;

  function spawnHazard() {
    const hazard = add([
      rect(20, 20),
      pos(0, 0),
      color(255, 0, 0),
      "hazard",
      { speed: hazardSpeed },
    ]);
    hazards.push(hazard);
    hazard.pos.x = width();
    hazard.pos.y = rand(height());
  }

  function updateHazards() {
    hazards.forEach(hazard => {
      hazard.pos.x -= hazard.speed * dt();
      if (hazard.pos.x < -20) {
        destroy(hazard);
        hazards.splice(hazards.indexOf(hazard), 1);
      }
    });
  }

  function checkCollisions() {
    const spark = get("player")[0];
    hazards.forEach(hazard => {
      if (spark.collides(hazard)) {
        score++;
        destroy(hazard);
        hazards.splice(hazards.indexOf(hazard), 1);
      }
    });
  }

  return {
    update: () => {
      updateHazards();
      checkCollisions();
    },
  };
};

const game = gameLevel();
scene("game", () => {
  add([
    text("Score: 0", 16),
    origin("topleft"),
    pos(10, 10),
    { score: 0 },
  ]);

  const scoreText = get("[text]")[0];

  game.update = () => {
    scoreText.text = "Score: " + game.score;
    game.update();
  };
});

go("game");