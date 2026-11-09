// Tiny top-down arena game drawn on a <canvas>.
// You're David Shea; Canvas assignments chase you. Shoot them, grab the gems they drop, survive.
// Everything is in "design pixels" (1920 x 1080), the same size as shop.png.

export const W = 1920;
export const H = 1080;

/** Shots you get each time you "buy" an ammo pack through the pay wall */
export const AMMO_PACK = 12;

const FONT = '"Supercell-Magic", sans-serif';

// Player portrait (only created in the browser; Game is built inside useEffect)
const avatar: HTMLImageElement =
  typeof Image !== "undefined" ? Object.assign(new Image(), { src: "/play/player-icon.png" }) : ({} as HTMLImageElement);

const gemSprite: HTMLImageElement =
  typeof Image !== "undefined" ? Object.assign(new Image(), { src: "/gem.png" }) : ({} as HTMLImageElement);

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
  title: string;
  due: string;
  pts: number;
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
  kind?: "fence" | "crate" | "barrel";
}

export interface GameStats {
  time: number;
  gems: number;
  kills: number;
}

// Arena: playable area sits between the top bar and the bottom bar of the shop art
const ARENA = { x: 60, y: 150, w: W - 120, h: H - 260 };

// Solid cover: wooden fences, crates and barrels
const WALLS: Wall[] = [
  { x: 400, y: 300, w: 280, h: 36, kind: "fence" },
  { x: 1240, y: 300, w: 280, h: 36, kind: "fence" },
  { x: 400, y: 760, w: 280, h: 36, kind: "fence" },
  { x: 1240, y: 760, w: 280, h: 36, kind: "fence" },
  { x: 290, y: 420, w: 36, h: 240, kind: "fence" },
  { x: 1594, y: 420, w: 36, h: 240, kind: "fence" },
  { x: 800, y: 500, w: 96, h: 96, kind: "crate" },
  { x: 908, y: 508, w: 80, h: 88, kind: "barrel" },
  { x: 1000, y: 508, w: 80, h: 88, kind: "barrel" },
  { x: 1092, y: 500, w: 96, h: 96, kind: "crate" },
  { x: 900, y: 230, w: 96, h: 96, kind: "crate" },
];

// Tall grass: walk through it, it goes see-through while you're inside
const BUSHES: Wall[] = [
  { x: 130, y: 180, w: 230, h: 150 },
  { x: 1560, y: 180, w: 230, h: 150 },
  { x: 130, y: 790, w: 230, h: 150 },
  { x: 1560, y: 790, w: 230, h: 150 },
  { x: 560, y: 470, w: 180, h: 160 },
  { x: 1180, y: 470, w: 180, h: 160 },
];

// Floor stones, generated once with a fixed seed so the map never changes
const STONES = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const out: { x: number; y: number; r: number; a: number }[] = [];
  for (let i = 0; i < 60; i++) {
    out.push({
      x: ARENA.x + 30 + rnd() * (ARENA.w - 60),
      y: ARENA.y + 30 + rnd() * (ARENA.h - 60),
      r: 22 + rnd() * 26,
      a: rnd() * Math.PI,
    });
  }
  return out;
})();

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
  /** Seconds left of the red "OUT OF AMMO" flash; the pay wall opens when it ends */
  noAmmoFx = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.player = {
      x: W / 2,
      y: ARENA.y + ARENA.h - 120,
      r: 48,
      hp: 3,
      maxHp: 3,
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
    this.spawnTimer = 0.6;
    this.shake = 0;
    this.over = false;
    this.ammo = 0;
    this.wantsAmmo = false;
    this.noAmmoFx = 0;
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

  /**
   * Runs while the game is otherwise frozen (out-of-ammo flash, pay wall):
   * every enemy keeps inching towards you, and they still hurt.
   */
  creep(dt: number) {
    if (this.over) return;
    const p = this.player;
    p.hurtTimer = Math.max(0, p.hurtTimer - dt);
    for (const e of this.enemies) {
      chase(e, p, CREEP_SPEED, dt, this.flowField());
      e.wobble += dt * 8;
      if (dist(e, p) < e.r + p.r) {
        e.hp = 0;
        this.hurtPlayer();
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    for (const pop of this.pops) pop.t += dt;
    this.pops = this.pops.filter((pop) => pop.t < 0.8);
    this.shake = Math.max(0, this.shake - dt);
  }

  private hurtPlayer() {
    const p = this.player;
    if (p.hurtTimer > 0) return;
    p.hp -= 1;
    p.hurtTimer = 1;
    this.shake = 0.3;
    this.pops.push({ x: p.x, y: p.y - 60, t: 0, text: "-1 HP", color: "#ff4d62" });
    if (p.hp <= 0) this.over = true;
  }

  stats(): GameStats {
    return { time: this.time, gems: this.gemCount, kills: this.kills };
  }

  update(dt: number, input: Input) {
    if (this.over) return;
    // Frozen while the screen flashes red, then hand over to the pay wall
    if (this.noAmmoFx > 0) {
      this.noAmmoFx -= dt;
      this.creep(dt);
      if (this.noAmmoFx <= 0) {
        this.noAmmoFx = 0;
        this.wantsAmmo = true;
      }
      return;
    }
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
      // No free shooting: flash the screen red, then the page opens the pay wall
      input.clicked = false;
      input.mouseDown = false;
      this.noAmmoFx = 0.7;
      this.shake = 0.7;
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
      this.spawnTimer = Math.max(0.22, 0.9 - this.time * 0.03);
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
      chase(e, p, e.speed, dt, this.flowField());
      e.flash = Math.max(0, e.flash - dt);
      e.wobble += dt * 8;

      for (const b of this.bullets) {
        if (b.life > 0 && dist(b, e) < e.r + 10) {
          b.life = 0;
          e.hp -= 1;
          e.flash = 0.1;
        }
      }

      if (e.hp > 0 && dist(e, p) < e.r + p.r) {
        e.hp = 0;
        this.hurtPlayer();
      } else if (e.hp <= 0) {
        this.kills += 1;
        this.gems.push({ x: e.x, y: e.y, t: 0 });
        this.pops.push({ x: e.x, y: e.y - 40, t: 0, text: "SUBMITTED!", color: "#ffe94a" });
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

  private field: Float32Array | null = null;
  private fieldFor = { x: -1, y: -1 };

  /** Route map to the player, rebuilt when the player has moved to another cell */
  private flowField() {
    const p = this.player;
    if (!this.field || Math.hypot(p.x - this.fieldFor.x, p.y - this.fieldFor.y) > CELL / 2) {
      this.field = buildFlowField(p);
      this.fieldFor = { x: p.x, y: p.y };
    }
    return this.field;
  }

  /** Off-screen canvas the flat world is drawn into before it gets tilted */
  private world: HTMLCanvasElement | null = null;

  draw(screen: CanvasRenderingContext2D) {
    if (!this.world) {
      this.world = document.createElement("canvas");
      this.world.width = W;
      this.world.height = H;
    }
    const ctx = this.world.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);
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
    for (const b of BUSHES) drawBush(ctx, b, pointInRect(this.player, b));
    for (const pop of this.pops) drawPop(ctx, pop);

    ctx.restore();

    // Tilt the camera: far rows shrink, near rows stay full size
    screen.fillStyle = "#b9583a";
    screen.fillRect(0, 0, W, H);
    projectWorld(screen, this.world);

    this.drawHud(screen);
    if (this.noAmmoFx > 0) drawNoAmmo(screen, this.noAmmoFx);
  }

  drawHud(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    // Hearts (top-left)
    for (let i = 0; i < p.maxHp; i++) {
      drawHeart(ctx, 100 + i * 64, 70, i < p.hp);
    }
    // Ammo (under the hearts): big counter, pulses red when empty
    drawAmmo(ctx, this.ammo, this.time);
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

/* ---------------- camera tilt ---------------- */
// The world is flat (W x H). On screen each row y is scaled by s(y): S_TOP at the
// far edge up to 1 at the near edge, and rows are squashed by the same amount,
// which gives the "looking down at an angle" depth of the reference game.

const S_TOP = 0.72;
const TILT_A = (1 - S_TOP) / (2 * H);
const TILT_OFFSET = H - H * (1 + S_TOP) / 2; // keep the near edge on the bottom of the screen

function rowScale(y: number) {
  return S_TOP + (1 - S_TOP) * (y / H);
}

function worldToScreenY(y: number) {
  return TILT_OFFSET + S_TOP * y + TILT_A * y * y;
}

/** Turn a point on screen (design pixels) into world coordinates, for aiming */
export function screenToWorld(x: number, y: number) {
  const v = Math.max(0, y - TILT_OFFSET);
  const wy = (-S_TOP + Math.sqrt(S_TOP * S_TOP + 4 * TILT_A * v)) / (2 * TILT_A);
  const wx = W / 2 + (x - W / 2) / rowScale(wy);
  return { x: wx, y: wy };
}

function projectWorld(screen: CanvasRenderingContext2D, world: HTMLCanvasElement) {
  const STRIP = 3;
  for (let y = 0; y < H; y += STRIP) {
    const s = rowScale(y + STRIP / 2);
    const y0 = worldToScreenY(y);
    const y1 = worldToScreenY(y + STRIP);
    const w = W * s;
    screen.drawImage(world, 0, y, W, STRIP, (W - w) / 2, y0, w, y1 - y0 + 0.6);
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

/* ---------------- pathfinding ---------------- */
// A coarse grid over the arena. Every few frames we flood it outwards from the
// player, so each cell knows how many steps it is from David. Enemies just walk
// downhill, which takes them round fences and crates instead of getting stuck.

const CELL = 30;
const COLS = Math.ceil(ARENA.w / CELL);
const ROWS = Math.ceil(ARENA.h / CELL);
const ENEMY_CLEARANCE = 46; // a bit less than the biggest enemy radius, so gaps stay usable

const BLOCKED: boolean[] = (() => {
  const out: boolean[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = ARENA.x + (c + 0.5) * CELL;
      const y = ARENA.y + (r + 0.5) * CELL;
      out.push(
        WALLS.some(
          (w) =>
            x > w.x - ENEMY_CLEARANCE &&
            x < w.x + w.w + ENEMY_CLEARANCE &&
            y > w.y - ENEMY_CLEARANCE &&
            y < w.y + w.h + ENEMY_CLEARANCE
        )
      );
    }
  }
  return out;
})();

const NEIGHBOURS = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];

function cellOf(p: Vec) {
  const c = Math.min(COLS - 1, Math.max(0, Math.floor((p.x - ARENA.x) / CELL)));
  const r = Math.min(ROWS - 1, Math.max(0, Math.floor((p.y - ARENA.y) / CELL)));
  return { c, r };
}

/** Steps from every cell to the target (Infinity where you can't get to it) */
function buildFlowField(target: Vec): Float32Array {
  const dist = new Float32Array(COLS * ROWS).fill(Infinity);
  const start = cellOf(target);
  const queue: number[] = [start.r * COLS + start.c];
  dist[queue[0]] = 0;
  for (let head = 0; head < queue.length; head++) {
    const idx = queue[head];
    const c = idx % COLS;
    const r = (idx - c) / COLS;
    for (const [dc, dr] of NEIGHBOURS) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
      const n = nr * COLS + nc;
      if (BLOCKED[n] || dist[n] !== Infinity) continue;
      // No cutting diagonally through the corner of an obstacle
      if (dc && dr && (BLOCKED[r * COLS + nc] || BLOCKED[nr * COLS + c])) continue;
      dist[n] = dist[idx] + 1;
      queue.push(n);
    }
  }
  return dist;
}

/** Move an enemy towards the player, following the flow field round obstacles */
function chase(e: Enemy, target: Vec, speed: number, dt: number, field: Float32Array) {
  let goal: Vec = target;
  const here = cellOf(e);
  const hereDist = field[here.r * COLS + here.c];
  if (hereDist > 2) {
    // Head for the neighbouring cell that's closest to the player
    let best = hereDist;
    let bestCell: { c: number; r: number } | null = null;
    for (const [dc, dr] of NEIGHBOURS) {
      const nc = here.c + dc;
      const nr = here.r + dr;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
      const d = field[nr * COLS + nc];
      if (d < best) {
        best = d;
        bestCell = { c: nc, r: nr };
      }
    }
    if (bestCell) {
      goal = { x: ARENA.x + (bestCell.c + 0.5) * CELL, y: ARENA.y + (bestCell.r + 0.5) * CELL };
    }
  }
  const a = Math.atan2(goal.y - e.y, goal.x - e.x);
  e.x += Math.cos(a) * speed * dt;
  e.y += Math.sin(a) * speed * dt;
  pushOutOfWalls(e);
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
  const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
  const big = kind === "Exam" || kind === "Project" || kind === "MST";
  return {
    x,
    y,
    r: big ? 50 : 40,
    hp: 3,
    // Normal speed while you play; everything slows to CREEP_SPEED behind the pay wall
    speed: (big ? 280 : 360) + Math.min(260, time * 7),
    flash: 0,
    wobble: Math.random() * 10,
    title: `${kind} ${rand(1, 10)}`,
    due: `Due ${MONTHS[rand(0, 11)]} ${rand(1, 28)} at 11:59pm`,
    pts: [5, 10, 20, 50, 100][rand(0, 4)],
  };
}

/** How fast every enemy crawls while the pay wall is up */
const CREEP_SPEED = 55;

const KINDS = ["Quiz", "Assignment", "Project", "Exam", "MST"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function rand(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
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

function drawAmmo(ctx: CanvasRenderingContext2D, ammo: number, time: number) {
  const empty = ammo <= 0;
  const x = 60;
  const y = 110;
  const w = 250;
  const h = 84;
  const pulse = empty ? 0.5 + 0.5 * Math.sin(time * 10) : 0;
  ctx.fillStyle = empty ? `rgba(${200 + 55 * pulse}, 30, 50, 0.95)` : "rgba(0,0,0,0.55)";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
  // Highlighter "bullet" icon
  ctx.save();
  ctx.translate(x + 50, y + h / 2);
  ctx.rotate(-0.5);
  ctx.fillStyle = "#fff23a";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  outlinedText(ctx, String(ammo), x + 95, y + 62, 56, empty ? "#fff" : "#ffe94a", "left");
  outlinedText(ctx, "AMMO", x + w - 16, y + 34, 20, "#cfe0ff", "right");
}

function drawNoAmmo(ctx: CanvasRenderingContext2D, t: number) {
  // Red flashing vignette + big warning
  const flash = 0.35 + 0.25 * Math.abs(Math.sin(t * 22));
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.65);
  g.addColorStop(0, `rgba(255, 0, 30, ${flash * 0.35})`);
  g.addColorStop(1, `rgba(200, 0, 20, ${flash + 0.25})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const pop = 1 + Math.max(0, t - 0.5) * 2;
  ctx.save();
  ctx.translate(W / 2 + (Math.random() - 0.5) * 16, H / 2 + (Math.random() - 0.5) * 16);
  ctx.scale(pop, pop);
  ctx.rotate(-0.05);
  outlinedText(ctx, "OUT OF AMMO!", 0, 30, 120, "#ff4d62", "center");
  ctx.restore();
}

function drawArena(ctx: CanvasRenderingContext2D) {
  // Canyon rock around the map
  ctx.fillStyle = "#b9583a";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#a24a30";
  for (let x = 0; x < W; x += 140) {
    ctx.beginPath();
    ctx.ellipse(x + 40, 40, 90, 40, 0.2, 0, Math.PI * 2);
    ctx.ellipse(x + 90, H - 30, 90, 40, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sand floor
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h, 28);
  ctx.clip();
  ctx.fillStyle = "#eba873";
  ctx.fillRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);

  // Flat paving stones
  for (const st of STONES) {
    ctx.save();
    ctx.translate(st.x, st.y);
    ctx.rotate(st.a);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const rr = st.r * (i % 2 ? 0.85 : 1);
      ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr * 0.8);
    }
    ctx.closePath();
    ctx.fillStyle = "#dc8f5c";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#f6c296";
    ctx.stroke();
    ctx.restore();
  }

  // Soft inner shadow along the edges
  ctx.lineWidth = 40;
  ctx.strokeStyle = "rgba(120, 50, 20, 0.18)";
  ctx.strokeRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);
  ctx.restore();

  ctx.lineWidth = 8;
  ctx.strokeStyle = "#6e2a16";
  ctx.beginPath();
  ctx.roundRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h, 28);
  ctx.stroke();
}

const OUTLINE = "#4a2410";

function drawWall(ctx: CanvasRenderingContext2D, w: Wall) {
  // Shadow under every obstacle
  ctx.fillStyle = "rgba(90, 35, 10, 0.3)";
  ctx.beginPath();
  ctx.roundRect(w.x + 8, w.y + 14, w.w, w.h, 10);
  ctx.fill();

  if (w.kind === "crate") drawCrate(ctx, w);
  else if (w.kind === "barrel") drawBarrel(ctx, w);
  else drawFence(ctx, w);
}

function drawFence(ctx: CanvasRenderingContext2D, w: Wall) {
  const horizontal = w.w >= w.h;
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUTLINE;

  // Rails
  ctx.fillStyle = "#b8682f";
  if (horizontal) {
    for (const ry of [w.y + 6, w.y + w.h - 16]) {
      ctx.beginPath();
      ctx.roundRect(w.x, ry, w.w, 10, 4);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    for (const rx of [w.x + 6, w.x + w.w - 16]) {
      ctx.beginPath();
      ctx.roundRect(rx, w.y, 10, w.h, 4);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Log posts, seen slightly from above
  const len = horizontal ? w.w : w.h;
  const count = Math.max(2, Math.round(len / 46));
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const cx = horizontal ? w.x + 18 + t * (w.w - 36) : w.x + w.w / 2;
    const cy = horizontal ? w.y + w.h / 2 : w.y + 18 + t * (w.h - 36);
    ctx.fillStyle = "#9c5326";
    ctx.beginPath();
    ctx.roundRect(cx - 15, cy - 26, 30, 44, 8);
    ctx.fill();
    ctx.stroke();
    // Top of the log with rings
    ctx.fillStyle = "#e6a467";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 24, 15, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 24, 7, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 5;
  }
}

function drawCrate(ctx: CanvasRenderingContext2D, w: Wall) {
  const front = w.h * 0.28; // visible front face (3/4 view)
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUTLINE;
  ctx.lineJoin = "round";

  // Front face
  ctx.fillStyle = "#b8692e";
  ctx.beginPath();
  ctx.roundRect(w.x, w.y + w.h - front, w.w, front, 6);
  ctx.fill();
  ctx.stroke();

  // Top face
  const top = { x: w.x, y: w.y - 10, w: w.w, h: w.h - front + 10 };
  ctx.fillStyle = "#eab06a";
  ctx.beginPath();
  ctx.roundRect(top.x, top.y, top.w, top.h, 6);
  ctx.fill();
  ctx.stroke();

  // Plank frame + cross brace
  const inset = 11;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#a35a24";
  ctx.strokeRect(top.x + inset, top.y + inset, top.w - inset * 2, top.h - inset * 2);
  ctx.beginPath();
  ctx.moveTo(top.x + inset, top.y + inset);
  ctx.lineTo(top.x + top.w - inset, top.y + top.h - inset);
  ctx.stroke();
  // Planks on the front
  ctx.strokeStyle = "#8a4519";
  ctx.beginPath();
  for (let i = 1; i < 3; i++) {
    const px = w.x + (w.w / 3) * i;
    ctx.moveTo(px, w.y + w.h - front + 4);
    ctx.lineTo(px, w.y + w.h - 4);
  }
  ctx.stroke();
}

function drawBarrel(ctx: CanvasRenderingContext2D, w: Wall) {
  const cx = w.x + w.w / 2;
  const rx = w.w / 2;
  const topY = w.y + 14;
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUTLINE;

  // Body
  ctx.fillStyle = "#a65a2a";
  ctx.beginPath();
  ctx.moveTo(w.x, topY);
  ctx.lineTo(w.x, w.y + w.h - 12);
  ctx.ellipse(cx, w.y + w.h - 12, rx, 12, 0, Math.PI, 0, true);
  ctx.lineTo(w.x + w.w, topY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Metal bands
  ctx.strokeStyle = "#5b5f6b";
  ctx.lineWidth = 6;
  for (const by of [w.y + w.h * 0.45, w.y + w.h * 0.8]) {
    ctx.beginPath();
    ctx.ellipse(cx, by, rx - 2, 10, 0, 0, Math.PI);
    ctx.stroke();
  }

  // Lid
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = "#d9894a";
  ctx.beginPath();
  ctx.ellipse(cx, topY, rx, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#a35a24";
  ctx.beginPath();
  ctx.ellipse(cx, topY, rx * 0.6, 9, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBush(ctx: CanvasRenderingContext2D, b: Wall, playerInside: boolean) {
  ctx.save();
  ctx.globalAlpha = playerInside ? 0.45 : 1;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#c65a10";
  const cols = Math.round(b.w / 34);
  const rows = Math.round(b.h / 34);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Stable "random" offset per blade cluster
      const j = Math.sin((r * 31 + c * 17) * 12.9898) * 0.5;
      const x = b.x + 17 + c * (b.w - 34) / Math.max(1, cols - 1) + j * 8;
      const y = b.y + 30 + r * (b.h - 40) / Math.max(1, rows - 1);
      // Three flame-shaped blades
      for (const [dx, hgt, col] of [
        [-10, 34, "#ff9a1f"],
        [10, 34, "#ff9a1f"],
        [0, 44, "#ffc43a"],
      ] as const) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x + dx - 9, y + 6);
        ctx.quadraticCurveTo(x + dx - 6, y - hgt * 0.5, x + dx + j * 6, y - hgt);
        ctx.quadraticCurveTo(x + dx + 6, y - hgt * 0.5, x + dx + 9, y + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }
  ctx.restore();
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

  // The player's face (round portrait with a thick black ring)
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r + 6, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.clip();
  if (avatar.complete && avatar.naturalWidth) {
    ctx.drawImage(avatar, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
  } else {
    ctx.fillStyle = "#c9b79c";
    ctx.fill();
  }
  ctx.restore();

  // Health bar
  const bw = 110;
  ctx.fillStyle = "#000";
  ctx.fillRect(p.x - bw / 2 - 4, p.y - p.r - 44, bw + 8, 20);
  ctx.fillStyle = "#46ec27";
  ctx.fillRect(p.x - bw / 2, p.y - p.r - 40, (bw * p.hp) / p.maxHp, 12);
  outlinedText(ctx, "DAVID SHEA", p.x, p.y - p.r - 54, 22, "#ffe94a", "center");
}

const CANVAS_FONT = 'Lato, "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Enemy drawn like a row from a Canvas LMS assignments list */
function drawDeadline(ctx: CanvasRenderingContext2D, e: Enemy) {
  const bob = Math.sin(e.wobble) * 3;
  const scale = e.r / 40;
  const w = 300 * scale;
  const h = 78 * scale;
  const x = e.x - w / 2;
  const y = e.y + bob - h / 2;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 8, w, h, 6 * scale);
  ctx.fill();

  // Card
  ctx.fillStyle = e.flash > 0 ? "#ffe0e0" : "#fff";
  ctx.strokeStyle = "#c7cdd1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6 * scale);
  ctx.fill();
  ctx.stroke();

  // Green "published" bar on the left, like Canvas
  ctx.fillStyle = "#0b874b";
  ctx.fillRect(x, y + 1, 5 * scale, h - 2);

  // Assignment icon: page with a pencil
  const ix = x + 18 * scale;
  const iy = y + 20 * scale;
  const s = scale;
  ctx.strokeStyle = "#2d3b45";
  ctx.lineWidth = 2.2 * s;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(ix + 16 * s, iy + 4 * s);
  ctx.lineTo(ix + 16 * s, iy);
  ctx.lineTo(ix, iy);
  ctx.lineTo(ix, iy + 24 * s);
  ctx.lineTo(ix + 16 * s, iy + 24 * s);
  ctx.lineTo(ix + 16 * s, iy + 20 * s);
  ctx.stroke();
  ctx.beginPath();
  for (const ly of [6, 11, 16]) {
    ctx.moveTo(ix + 4 * s, iy + ly * s);
    ctx.lineTo(ix + 10 * s, iy + ly * s);
  }
  ctx.stroke();
  ctx.beginPath(); // pencil
  ctx.moveTo(ix + 10 * s, iy + 18 * s);
  ctx.lineTo(ix + 22 * s, iy + 6 * s);
  ctx.lineTo(ix + 25 * s, iy + 9 * s);
  ctx.lineTo(ix + 13 * s, iy + 21 * s);
  ctx.lineTo(ix + 9 * s, iy + 22 * s);
  ctx.closePath();
  ctx.stroke();

  // Title + due line
  const tx = x + 52 * scale;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#2d3b45";
  ctx.font = `bold ${22 * scale}px ${CANVAS_FONT}`;
  ctx.fillText(e.title, tx, y + 33 * scale);
  ctx.font = `${14 * scale}px ${CANVAS_FONT}`;
  ctx.fillStyle = "#e0061f";
  ctx.font = `bold ${14 * scale}px ${CANVAS_FONT}`;
  const due = e.due;
  ctx.fillText(due, tx, y + 58 * scale);
  const dw = ctx.measureText(due).width;
  ctx.fillStyle = "#6b7780";
  ctx.font = `${14 * scale}px ${CANVAS_FONT}`;
  ctx.fillText(`  |  0/${e.pts} pts`, tx + dw, y + 58 * scale);
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
  if (gemSprite.complete && gemSprite.naturalWidth > 0) {
    ctx.drawImage(gemSprite, -s, -s, s * 2, s * 2);
  } else {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 5;
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
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
