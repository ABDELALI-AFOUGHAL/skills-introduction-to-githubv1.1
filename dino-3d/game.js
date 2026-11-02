const scoreElement = document.getElementById("score");
const messageElement = document.getElementById("message");

const canvas = document.createElement("canvas");
canvas.style.display = "block";
canvas.style.width = "100vw";
canvas.style.height = "100vh";
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

const world = {
  dino: { y: 0, velocityY: 0, width: 1, height: 1.6, depth: 1 },
  obstacles: [],
  gravity: -24,
  speed: 14,
  score: 0,
  gameOver: false,
  spawnTimer: 0,
  nextSpawn: 1,
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

function project(x, y, z) {
  const fov = 420;
  const camZ = -7;
  const depth = z - camZ;
  const scale = fov / depth;

  return {
    x: canvas.width * 0.34 + x * scale,
    y: canvas.height * 0.72 - y * scale,
    scale,
  };
}

function drawBox(x, y, z, w, h, d, color) {
  const front = project(x, y, z);
  const right = project(x + w, y, z);
  const top = project(x, y + h, z);
  const depth = project(x, y, z + d);

  const boxW = right.x - front.x;
  const boxH = front.y - top.y;
  const depthShift = (depth.x - front.x) * 0.55;
  const depthRise = (depth.y - front.y) * 0.55;

  ctx.fillStyle = color;
  ctx.fillRect(front.x, top.y, boxW, boxH);

  ctx.fillStyle = "rgba(0,0,0,0.17)";
  ctx.beginPath();
  ctx.moveTo(front.x + boxW, top.y);
  ctx.lineTo(front.x + boxW + depthShift, top.y + depthRise);
  ctx.lineTo(front.x + boxW + depthShift, top.y + depthRise + boxH);
  ctx.lineTo(front.x + boxW, top.y + boxH);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.moveTo(front.x, top.y);
  ctx.lineTo(front.x + depthShift, top.y + depthRise);
  ctx.lineTo(front.x + boxW + depthShift, top.y + depthRise);
  ctx.lineTo(front.x + boxW, top.y);
  ctx.closePath();
  ctx.fill();
}

function drawGround() {
  const nearLeft = project(-2, 0, 3);
  const nearRight = project(11, 0, 3);
  const farRight = project(12, 0, 65);
  const farLeft = project(-2.5, 0, 65);

  const gradient = ctx.createLinearGradient(0, nearLeft.y, 0, farLeft.y);
  gradient.addColorStop(0, "#e3d2a8");
  gradient.addColorStop(1, "#ceb37a");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(nearLeft.x, nearLeft.y);
  ctx.lineTo(nearRight.x, nearRight.y);
  ctx.lineTo(farRight.x, farRight.y);
  ctx.lineTo(farLeft.x, farLeft.y);
  ctx.closePath();
  ctx.fill();
}

function spawnObstacle() {
  world.obstacles.push({
    x: 20,
    z: 18 + Math.random() * 22,
    width: 0.8 + Math.random() * 0.4,
    height: 1.1 + Math.random() * 1.2,
    depth: 0.8,
  });
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y &&
    a.z < b.z + b.depth &&
    a.z + a.depth > b.z
  );
}

function jump() {
  if (!world.gameOver && world.dino.y <= 0.01) {
    world.dino.velocityY = 11;
  }
}

function restart() {
  world.dino.y = 0;
  world.dino.velocityY = 0;
  world.obstacles = [];
  world.score = 0;
  world.gameOver = false;
  world.spawnTimer = 0;
  world.nextSpawn = 1;
  scoreElement.textContent = "0";
  messageElement.classList.remove("show");
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    jump();
  }
  if (event.code === "KeyR") {
    restart();
  }
});

let previous = performance.now();

function frame(now) {
  const delta = Math.min((now - previous) / 1000, 0.05);
  previous = now;

  ctx.fillStyle = "#cde8ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGround();

  if (!world.gameOver) {
    world.spawnTimer += delta;
    if (world.spawnTimer >= world.nextSpawn) {
      world.spawnTimer = 0;
      world.nextSpawn = 0.7 + Math.random() * 0.9;
      spawnObstacle();
    }

    world.dino.velocityY += world.gravity * delta;
    world.dino.y = Math.max(0, world.dino.y + world.dino.velocityY * delta);
    if (world.dino.y === 0) {
      world.dino.velocityY = 0;
    }

    world.score += delta * 10;
    scoreElement.textContent = String(Math.floor(world.score));

    for (let i = world.obstacles.length - 1; i >= 0; i -= 1) {
      const obstacle = world.obstacles[i];
      obstacle.x -= world.speed * delta;

      if (obstacle.x < -5) {
        world.obstacles.splice(i, 1);
        continue;
      }

      const dinoHitBox = {
        x: 0,
        y: world.dino.y,
        z: 20,
        width: world.dino.width,
        height: world.dino.height,
        depth: world.dino.depth,
      };

      const obstacleHitBox = {
        x: obstacle.x,
        y: 0,
        z: obstacle.z,
        width: obstacle.width,
        height: obstacle.height,
        depth: obstacle.depth,
      };

      if (intersects(dinoHitBox, obstacleHitBox)) {
        world.gameOver = true;
        messageElement.classList.add("show");
      }
    }
  }

  drawBox(0, world.dino.y, 20, 1, 1.6, 1, "#4b4b4b");

  for (const obstacle of world.obstacles) {
    drawBox(obstacle.x, 0, obstacle.z, obstacle.width, obstacle.height, obstacle.depth, "#2d8a34");
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
