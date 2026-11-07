// Tiny top-down arena game drawn on a <canvas>.
// You're a student; deadline clocks chase you. Shoot them, grab the gems they drop, survive.
// Everything is in "design pixels" (1920 x 1080), the same size as shop.png.

export const W = 1920;
export const H = 1080;

/** Shots you get each time you "buy" an ammo pack through the pay wall */
export const AMMO_PACK = 12;

const FONT = '"Supercell-Magic", sans-serif';

type Vec = { x: number; y: number };

interface Player extends Vec {
  r: number;
  hp: number;
  maxHp: number;
  hurtTimer: number; // seconds of invulnerability left after a hit
  shootCooldown: number;
  aim: number; // angle in radians
}

interface Enemy extends Vec {
  r: number;
  hp: number;
  speed: number;
  flash: number;
  wobble: number;
}

interface Bullet extends Vec {
  vx: number;
  vy: number;
  life: number;
}

interface Gem extends Vec {
  t: number;
}

interface Pop extends Vec {
  t: number;
  text: string;
  color: string;
}

interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GameStats {
  time: number;
  gems: number;
  kills: number;
}

// Arena: playable area sits between the top bar and the bottom bar of the shop art
const ARENA = { x: 60, y: 150, w: W - 120, h: H - 260 };

const WALLS: Wall[] = [
  { x: 420, y: 330, w: 200, h: 90 },
  { x: 1300, y: 330, w: 200, h: 90 },
  { x: 860, y: 520, w: 200, h: 90 },
  { x: 420, y: 700, w: 200, h: 90 },
  { x: 1300, y: 700, w: 200, h: 90 },
];

export interface Input {
  keys: Set<string>;
  mouse: Vec;
  mouseDown: boolean;
  /** A click that happened since the last frame (so very quick clicks still count) */
  clicked: boolean;
}

export class Game {
  player!: Player;
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  gems: Gem[] = [];
  pops: Pop[] = [];
  time = 0;
  gemCount = 0;
  kills = 0;
  spawnTimer = 0;
  shake = 0;
  over = false;
  /** Shots left. Starts at 0, so the very first shot needs a purchase. */
  ammo = 0;
  /** Set when you try to shoot with no ammo; the page then opens the pay wall */
  wantsAmmo = false;

  constructor() {
    this.reset();
  }

  reset() {
    this.player = {
      x: W / 2,
      y: ARENA.y + ARENA.h - 120,
      r: 40,
      hp: 5,
      maxHp: 5,
      hurtTimer: 0,
      shootCooldown: 0,
      aim: -Math.PI / 2,
    };
    this.enemies = [];
    this.bullets = [];
    this.gems = [];
    this.pops = [];
    this.time = 0;
    this.gemCount = 0;
    this.kills = 0;
    this.spawnTimer = 1;
    this.shake = 0;
    this.over = false;
    this.ammo = 0;
    this.wantsAmmo = false;
  }

  buyAmmo() {
    this.ammo += AMMO_PACK;
    this.wantsAmmo = false;
  }

  /** Give the player one more go with full health (after "paying" to revive) */
  revive() {
    this.player.hp = this.player.maxHp;
    this.player.hurtTimer = 2;
    this.enemies = [];
    this.over = false;
  }

  stats(): GameStats {
    return { time: this.time, gems: this.gemCount, kills: this.kills };
  }

  update(dt: number, input: Input) {
    if (this.over) return;
    this.time += dt;
    const p = this.player;

    // --- Movement (WASD / arrows) ---
    let dx = 0;
    let dy = 0;
    const k = input.keys;
    if (k.has("a") || k.has("arrowleft")) dx -= 1;
    if (k.has("d") || k.has("arrowright")) dx += 1;
    if (k.has("w") || k.has("arrowup")) dy -= 1;
    if (k.has("s") || k.has("arrowdown")) dy += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      p.x += (dx / len) * 560 * dt;
      p.y += (dy / len) * 560 * dt;
    }
    keepInArena(p);
    pushOutOfWalls(p);

    // --- Aim at the mouse, shoot on click or space ---
    p.aim = Math.atan2(input.mouse.y - p.y, input.mouse.x - p.x);
    p.shootCooldown -= dt;
    const wantsToShoot = input.mouseDown || input.clicked || k.has(" ");
    if (wantsToShoot && p.shootCooldown <= 0 && this.ammo <= 0) {
      // No free shooting. Ask the page to open the pay wall.
      input.clicked = false;
      this.wantsAmmo = true;
      return;
    }
    if (wantsToShoot && p.shootCooldown <= 0) {
      input.clicked = false;
      p.shootCooldown = 0.18;
      this.ammo -= 1;
      const speed = 1500;
      this.bullets.push({
        x: p.x + Math.cos(p.aim) * (p.r + 18),
        y: p.y + Math.sin(p.aim) * (p.r + 18),
        vx: Math.cos(p.aim) * speed,
        vy: Math.sin(p.aim) * speed,
        life: 0.7,
      });
    }
    p.hurtTimer = Math.max(0, p.hurtTimer - dt);

    // --- Spawn deadlines, faster as time goes on ---
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.35, 1.5 - this.time * 0.025);
      this.enemies.push(spawnEnemy(this.time));
    }

    // --- Bullets ---
    for (const b of this.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (WALLS.some((w) => pointInRect(b, w))) b.life = 0;
    }

    // --- Enemies chase the player ---
    for (const e of this.enemies) {
      const a = Math.atan2(p.y - e.y, p.x - e.x);
      e.x += Math.cos(a) * e.speed * dt;
      e.y += Math.sin(a) * e.speed * dt;
      e.flash = Math.max(0, e.flash - dt);
      e.wobble += dt * 8;
      pushOutOfWalls(e);

      for (const b of this.bullets) {
        if (b.life > 0 && dist(b, e) < e.r + 10) {
          b.life = 0;
          e.hp -= 1;
          e.flash = 0.1;
        }
      }

      if (e.hp > 0 && dist(e, p) < e.r + p.r) {
        e.hp = 0;
        if (p.hurtTimer <= 0) {
          p.hp -= 1;
          p.hurtTimer = 1;
          this.shake = 0.3;
          this.pops.push({ x: p.x, y: p.y - 60, t: 0, text: "-1 HP", color: "#ff4d62" });
          if (p.hp <= 0) this.over = true;
        }
      } else if (e.hp <= 0) {
        this.kills += 1;
        this.gems.push({ x: e.x, y: e.y, t: 0 });
        this.pops.push({ x: e.x, y: e.y - 40, t: 0, text: "EXTENDED!", color: "#ffe94a" });
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    this.bullets = this.bullets.filter((b) => b.life > 0);

    // --- Gems get pulled in when close ---
    for (const g of this.gems) {
      g.t += dt;
      const d = dist(g, p);
      if (d < 220) {
        const a = Math.atan2(p.y - g.y, p.x - g.x);
        g.x += Math.cos(a) * 900 * dt;
        g.y += Math.sin(a) * 900 * dt;
      }
      if (d < p.r + 10) {
        g.t = -1;
        this.gemCount += 1;
      }
    }
    this.gems = this.gems.filter((g) => g.t >= 0 && g.t < 10);

    for (const pop of this.pops) pop.t += dt;
    this.pops = this.pops.filter((pop) => pop.t < 0.8);
    this.shake = Math.max(0, this.shake - dt);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 24 * this.shake, (Math.random() - 0.5) * 24 * this.shake);
    }

    drawArena(ctx);
    for (const w of WALLS) drawWall(ctx, w);
    for (const g of this.gems) drawGem(ctx, g);
    for (const e of this.enemies) drawDeadline(ctx, e);
    for (const b of this.bullets) drawBullet(ctx, b);
    drawPlayer(ctx, this.player);
    for (const pop of this.pops) drawPop(ctx, pop);

    ctx.restore();
    this.drawHud(ctx);
  }

  drawHud(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    // Hearts (top-left)
    for (let i = 0; i < p.maxHp; i++) {
      drawHeart(ctx, 100 + i * 64, 70, i < p.hp);
    }
    // Ammo (under the hearts)
    const empty = this.ammo <= 0;
    outlinedText(
      ctx,
      empty ? "AMMO 0 · BUY MORE!" : `AMMO ${this.ammo}`,
      70,
      136,
      30,
      empty ? "#ff4d62" : "#ffe94a",
      "left"
    );
    // Survival timer (top-centre)
    outlinedText(ctx, `SURVIVED ${formatTime(this.time)}`, W / 2, 80, 44, "#fff", "center");
    // Gem counter (top-right)
    drawGem(ctx, { x: W - 250, y: 68, t: 0 }, 1.3);
    outlinedText(ctx, String(this.gemCount), W - 210, 84, 46, "#fff", "left");
    // Controls hint (bottom)
    outlinedText(
      ctx,
      "WASD / ARROWS MOVE   ·   MOUSE AIM   ·   CLICK / SPACE SHOOT   ·   ESC PAUSE",
      W / 2,
      H - 52,
      24,
      "#cfe0ff",
      "center"
    );
  }
}

/* ---------------- helpers ---------------- */

function dist(a: Vec, b: Vec) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointInRect(p: Vec, r: Wall) {
  return p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
}

function keepInArena(c: Vec & { r: number }) {
  c.x = Math.min(ARENA.x + ARENA.w - c.r, Math.max(ARENA.x + c.r, c.x));
  c.y = Math.min(ARENA.y + ARENA.h - c.r, Math.max(ARENA.y + c.r, c.y));
}

/** Slide circles along walls instead of passing through them */
function pushOutOfWalls(c: Vec & { r: number }) {
  for (const w of WALLS) {
    const nx = Math.max(w.x, Math.min(c.x, w.x + w.w));
    const ny = Math.max(w.y, Math.min(c.y, w.y + w.h));
    const dx = c.x - nx;
    const dy = c.y - ny;
    const d = Math.hypot(dx, dy);
    if (d < c.r) {
      if (d === 0) {
        c.y = w.y - c.r;
      } else {
        c.x = nx + (dx / d) * c.r;
        c.y = ny + (dy / d) * c.r;
      }
    }
  }
}

function spawnEnemy(time: number): Enemy {
  const side = Math.floor(Math.random() * 3); // left, top, right (not the bottom, where you start)
  let x = 0;
  let y = 0;
  if (side === 0) {
    x = ARENA.x + 40;
    y = ARENA.y + Math.random() * ARENA.h;
  } else if (side === 1) {
    x = ARENA.x + Math.random() * ARENA.w;
    y = ARENA.y + 40;
  } else {
    x = ARENA.x + ARENA.w - 40;
    y = ARENA.y + Math.random() * ARENA.h;
  }
  const big = Math.random() < Math.min(0.35, time / 120);
  return {
    x,
    y,
    r: big ? 52 : 36,
    hp: big ? 6 : 3,
    speed: (big ? 130 : 190) + Math.min(200, time * 4),
    flash: 0,
    wobble: Math.random() * 10,
  };
}

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function outlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign
) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.22;
  ctx.strokeStyle = "#000";
  ctx.strokeText(text, x, y + size * 0.08);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/* ---------------- drawing ---------------- */

function drawArena(ctx: CanvasRenderingContext2D) {
  // Page background (same blues as the shop)
  const bg = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, "#4f8dff");
  bg.addColorStop(1, "#1d3fc4");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Checkered floor
  const tile = 90;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h, 24);
  ctx.clip();
  ctx.fillStyle = "#3f78f0";
  ctx.fillRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);
  ctx.fillStyle = "#4a84f7";
  for (let y = ARENA.y; y < ARENA.y + ARENA.h; y += tile) {
    for (let x = ARENA.x; x < ARENA.x + ARENA.w; x += tile) {
      if (((x - ARENA.x) / tile + (y - ARENA.y) / tile) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.restore();

  // Thick arena border
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.roundRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h, 24);
  ctx.stroke();
}

function drawWall(ctx: CanvasRenderingContext2D, w: Wall) {
  // Stack of textbooks
  const colors = ["#ef4444", "#22c55e", "#facc15"];
  const layer = w.h / 3;
  for (let i = 0; i < 3; i++) {
    const inset = i === 1 ? 10 : 0;
    ctx.fillStyle = colors[i];
    ctx.fillRect(w.x + inset, w.y + i * layer, w.w - inset * 2, layer);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(w.x + w.w - inset - 26, w.y + i * layer + 6, 14, layer - 12);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#000";
    ctx.strokeRect(w.x + inset, w.y + i * layer, w.w - inset * 2, layer);
  }
  // Drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(w.x + 8, w.y + w.h + 3, w.w - 8, 14);
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player) {
  // Blink while invulnerable
  if (p.hurtTimer > 0 && Math.floor(p.hurtTimer * 12) % 2 === 0) return;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + p.r * 0.9, p.r * 0.9, p.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlighter "blaster" pointing at the mouse
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.aim);
  ctx.fillStyle = "#facc15";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.roundRect(p.r * 0.4, -12, p.r + 26, 24, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f472b6";
  ctx.fillRect(p.r + 18, -12, 10, 24);
  ctx.restore();

  // Backpack
  ctx.fillStyle = "#7c3aed";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.roundRect(p.x - p.r * 0.8, p.y - p.r * 0.2, p.r * 1.6, p.r * 1.1, 14);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = "#ffd3a8";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 6, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hair
  ctx.fillStyle = "#5b3a1e";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 10, p.r, Math.PI * 1.05, Math.PI * 1.95);
  ctx.lineTo(p.x + p.r * 0.5, p.y - p.r * 0.55);
  ctx.lineTo(p.x, p.y - p.r * 0.75);
  ctx.lineTo(p.x - p.r * 0.5, p.y - p.r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Eyes look where you aim
  const lx = Math.cos(p.aim) * 5;
  const ly = Math.sin(p.aim) * 5;
  for (const ex of [-14, 14]) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(p.x + ex, p.y + 2, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(p.x + ex + lx, p.y + 3 + ly, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Health bar
  const bw = 110;
  ctx.fillStyle = "#000";
  ctx.fillRect(p.x - bw / 2 - 4, p.y - p.r - 44, bw + 8, 20);
  ctx.fillStyle = "#46ec27";
  ctx.fillRect(p.x - bw / 2, p.y - p.r - 40, (bw * p.hp) / p.maxHp, 12);
  outlinedText(ctx, "YOU", p.x, p.y - p.r - 54, 22, "#ffe94a", "center");
}

function drawDeadline(ctx: CanvasRenderingContext2D, e: Enemy) {
  const bob = Math.sin(e.wobble) * 3;
  const x = e.x;
  const y = e.y + bob;
  const r = e.r;

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(x, e.y + r * 0.95, r * 0.85, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 7;

  // Alarm bells
  ctx.fillStyle = "#ff4d62";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + s * r * 0.62, y - r * 0.78, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Clock body
  ctx.fillStyle = e.flash > 0 ? "#fff" : "#ff4d62";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.stroke();

  // Angry brows + eyes
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.45, y - r * 0.32);
  ctx.lineTo(x - r * 0.12, y - r * 0.18);
  ctx.moveTo(x + r * 0.45, y - r * 0.32);
  ctx.lineTo(x + r * 0.12, y - r * 0.18);
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(x - r * 0.26, y - r * 0.02, r * 0.09, 0, Math.PI * 2);
  ctx.arc(x + r * 0.26, y - r * 0.02, r * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // "DUE" label
  outlinedText(ctx, "DUE", x, y + r * 0.45, r * 0.42, "#ff4d62", "center");
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(Math.atan2(b.vy, b.vx));
  ctx.fillStyle = "#fff23a";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGem(ctx: CanvasRenderingContext2D, g: Gem, scale = 1) {
  const s = 22 * scale;
  const y = g.y + Math.sin(g.t * 6) * 4;
  ctx.save();
  ctx.translate(g.x, y);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 5;
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.9, -s * 0.25);
  ctx.lineTo(s * 0.55, s * 0.85);
  ctx.lineTo(-s * 0.55, s * 0.85);
  ctx.lineTo(-s * 0.9, -s * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#bef264";
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.55);
  ctx.lineTo(s * 0.45, -s * 0.12);
  ctx.lineTo(s * 0.28, s * 0.45);
  ctx.lineTo(-s * 0.28, s * 0.45);
  ctx.lineTo(-s * 0.45, -s * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, full: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = full ? "#ff3b47" : "#3b3b52";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.bezierCurveTo(-34, 0, -24, -28, 0, -12);
  ctx.bezierCurveTo(24, -28, 34, 0, 0, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (full) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.ellipse(-10, -8, 6, 4, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPop(ctx: CanvasRenderingContext2D, pop: Pop) {
  ctx.globalAlpha = 1 - pop.t / 0.8;
  outlinedText(ctx, pop.text, pop.x, pop.y - pop.t * 70, 28, pop.color, "center");
  ctx.globalAlpha = 1;
}
