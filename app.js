const canvas = document.getElementById('arena');
const ctx = canvas.getContext('2d');

const hpS = document.getElementById('hp-sukuna');
const hpM = document.getElementById('hp-mahoraga');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart');

const W = canvas.width;
const H = canvas.height;
const FLOOR = 54;

let effects = [];
let projectiles = [];
let battleOver = false;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

class Fighter {
  constructor(name, x, tint) {
    this.name = name;
    this.x = x;
    this.y = rand(150, H - FLOOR - 120);
    this.vx = rand(-130, 130);
    this.vy = rand(-90, 90);
    this.w = 90;
    this.h = 120;
    this.maxHp = 1000;
    this.hp = 1000;
    this.tint = tint;
    this.cooldown = 0;
    this.hitFlash = 0;
    this.glow = 0;
    this.adaptLevel = 0;
  }

  center() {
    return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
  }

  takeDamage(value, source = '') {
    const adjusted = this.name === 'Mahoraga' ? value * (1 - this.adaptLevel * 0.06) : value;
    this.hp = clamp(this.hp - adjusted, 0, this.maxHp);
    this.hitFlash = 0.22;

    if (this.name === 'Mahoraga' && Math.random() < 0.42) {
      this.adaptLevel = clamp(this.adaptLevel + 1, 0, 6);
      this.glow = 0.35;
      effects.push({ type: 'adapt', x: this.center().x, y: this.center().y, t: 0.6 });
      statusEl.textContent = `Mahoraga adapted to ${source || 'damage'}! (${this.adaptLevel} stacks)`;
    }
  }

  update(dt) {
    this.cooldown -= dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.glow = Math.max(0, this.glow - dt);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x <= 8 || this.x + this.w >= W - 8) {
      this.vx *= -1;
      this.x = clamp(this.x, 8, W - this.w - 8);
    }
    if (this.y <= 8 || this.y + this.h >= H - FLOOR - 8) {
      this.vy *= -1;
      this.y = clamp(this.y, 8, H - FLOOR - this.h - 8);
    }

    this.vx += rand(-28, 28) * dt;
    this.vy += rand(-24, 24) * dt;

    const speed = Math.hypot(this.vx, this.vy);
    const maxSpeed = 230;
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }
  }

  draw() {
    const flash = this.hitFlash > 0 ? 70 : 0;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.glow > 0) {
      ctx.shadowColor = '#b5ffc8';
      ctx.shadowBlur = 26;
    }

    ctx.fillStyle = this.tint;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, this.w, this.h);

    ctx.fillStyle = `rgb(${220 + flash},${190 + flash},${180 + flash})`;
    ctx.beginPath();
    ctx.arc(this.w / 2, 34, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(16, 58, this.w - 32, this.h - 66);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name.toUpperCase(), this.w / 2, this.h - 8);

    ctx.restore();

    drawCrossHp(this);
  }
}

const sukuna = new Fighter('Sukuna', 120, '#7a1f1f');
const mahoraga = new Fighter('Mahoraga', W - 220, '#204f32');

function drawCrossHp(fighter) {
  const x = fighter.x + fighter.w / 2;
  const y = fighter.y - 34;
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#e9e9e9';
  ctx.lineWidth = 1;
  ctx.fillRect(x - 18, y - 38, 36, 74);
  ctx.fillRect(x - 36, y - 20, 72, 36);
  ctx.strokeRect(x - 18, y - 38, 36, 74);
  ctx.strokeRect(x - 36, y - 20, 72, 36);

  ctx.fillStyle = '#8d949d';
  ctx.font = '28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(Math.round(fighter.hp), x, y + 10);
  ctx.restore();
}

function spawnSlashRain() {
  for (let i = 0; i < 22; i++) {
    effects.push({ type: 'slash', x: rand(30, W - 30), y: rand(20, H - FLOOR - 20), t: rand(0.3, 0.8) });
  }
}

function sukunaAbilities(target) {
  if (Math.random() < 0.52) {
    // Cleave/Dismantle burst
    for (let i = 0; i < 3; i++) {
      const a = Math.atan2(target.center().y - sukuna.center().y, target.center().x - sukuna.center().x) + rand(-0.28, 0.28);
      projectiles.push({ type: 'slashbolt', from: 'Sukuna', x: sukuna.center().x, y: sukuna.center().y, vx: Math.cos(a) * 370, vy: Math.sin(a) * 370, dmg: rand(22, 35), r: 6 });
    }
    statusEl.textContent = 'Sukuna used Cleave + Dismantle!';
  } else if (Math.random() < 0.65) {
    // Fuga
    const a = Math.atan2(target.center().y - sukuna.center().y, target.center().x - sukuna.center().x);
    projectiles.push({ type: 'fuga', from: 'Sukuna', x: sukuna.center().x, y: sukuna.center().y, vx: Math.cos(a) * 290, vy: Math.sin(a) * 290, dmg: rand(55, 85), r: 15 });
    statusEl.textContent = 'Sukuna fired Fuga!';
  } else {
    // goofy Domain expansion
    effects.push({ type: 'handsign', x: sukuna.center().x, y: sukuna.y - 8, t: 0.8 });
    effects.push({ type: 'shrine', x: W / 2, y: H / 2 - 36, t: 1.4 });
    effects.push({ type: 'domainTint', t: 1.1 });
    spawnSlashRain();
    target.takeDamage(rand(65, 110), 'Malevolent Shrine');
    statusEl.textContent = 'Domain Expansion: Malevolent Shrine!';
  }
}

function mahoragaAbilities(target) {
  if (Math.random() < 0.55) {
    // Blade wheel orbit + fling
    const origin = mahoraga.center();
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * 2 * i) / 4 + performance.now() * 0.002;
      projectiles.push({ type: 'orbit', from: 'Mahoraga', owner: mahoraga, angle: a, radius: 38 + i * 12, spin: rand(2.2, 3.5), ttl: 0.95, dmg: rand(10, 18), released: false });
    }
    effects.push({ type: 'adapt', x: origin.x, y: origin.y, t: 0.5 });
    statusEl.textContent = 'Mahoraga spun adaptation blades!';
  } else {
    // slam projectile
    const a = Math.atan2(target.center().y - mahoraga.center().y, target.center().x - mahoraga.center().x);
    projectiles.push({ type: 'wheelshot', from: 'Mahoraga', x: mahoraga.center().x, y: mahoraga.center().y, vx: Math.cos(a) * 310, vy: Math.sin(a) * 310, dmg: rand(28, 44), r: 12 });
    statusEl.textContent = 'Mahoraga launched adaptation wheel!';
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updateProjectiles(dt) {
  for (const p of projectiles) {
    if (p.type === 'orbit') {
      p.ttl -= dt;
      p.angle += p.spin * dt;
      const o = p.owner.center();
      p.x = o.x + Math.cos(p.angle) * p.radius;
      p.y = o.y + Math.sin(p.angle) * p.radius;
      if (p.ttl < 0.28 && !p.released) {
        p.released = true;
        const target = p.from === 'Mahoraga' ? sukuna : mahoraga;
        const a = Math.atan2(target.center().y - p.y, target.center().x - p.x);
        p.vx = Math.cos(a) * 280;
        p.vy = Math.sin(a) * 280;
      }
      if (p.released) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    const target = p.from === 'Sukuna' ? mahoraga : sukuna;
    const hitBox = { x: target.x, y: target.y, w: target.w, h: target.h };
    const pr = p.r || 8;
    const probe = { x: p.x - pr, y: p.y - pr, w: pr * 2, h: pr * 2 };
    if (rectsOverlap(hitBox, probe)) {
      target.takeDamage(p.dmg, p.type);
      p.dead = true;
      effects.push({ type: p.type === 'fuga' ? 'boom' : 'hit', x: p.x, y: p.y, t: 0.4 });
    }

    if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30 || p.ttl <= 0) {
      p.dead = true;
    }
  }

  projectiles = projectiles.filter((p) => !p.dead);
}

function updateEffects(dt) {
  effects.forEach((e) => (e.t -= dt));
  effects = effects.filter((e) => e.t > 0);
}

function drawArena() {
  ctx.clearRect(0, 0, W, H);

  // floor strip
  ctx.fillStyle = '#1f88b2';
  ctx.fillRect(0, H - FLOOR, W, FLOOR);

  const tint = effects.find((e) => e.type === 'domainTint');
  if (tint) {
    ctx.fillStyle = 'rgba(255, 40, 40, 0.14)';
    ctx.fillRect(0, 0, W, H - FLOOR);
  }
}

function drawEffects() {
  for (const e of effects) {
    ctx.save();

    if (e.type === 'adapt') {
      ctx.strokeStyle = 'rgba(170,255,200,0.85)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 24 + (1 - e.t) * 26, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (e.type === 'slash') {
      ctx.translate(e.x, e.y);
      ctx.rotate(rand(-0.6, 0.6));
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, -10);
      ctx.lineTo(16, 10);
      ctx.stroke();
    }

    if (e.type === 'handsign') {
      ctx.fillStyle = 'rgba(255,196,164,0.92)';
      ctx.fillRect(e.x - 18, e.y - 50, 36, 42);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SIGN', e.x, e.y - 22);
    }

    if (e.type === 'shrine') {
      ctx.fillStyle = 'rgba(140,30,30,0.75)';
      ctx.fillRect(e.x - 56, e.y - 72, 112, 128);
      ctx.strokeStyle = '#ffe1e1';
      ctx.lineWidth = 3;
      ctx.strokeRect(e.x - 56, e.y - 72, 112, 128);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('SHRINE', e.x, e.y + 70);
    }

    if (e.type === 'boom') {
      ctx.fillStyle = 'rgba(255,130,20,0.65)';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 24 + (1 - e.t) * 20, 0, Math.PI * 2);
      ctx.fill();
    }

    if (e.type === 'hit') {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 10 + (1 - e.t) * 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    ctx.save();
    if (p.type === 'fuga') {
      ctx.fillStyle = 'rgba(255,120,20,0.9)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff1cc';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (p.type === 'wheelshot' || p.type === 'orbit') {
      ctx.strokeStyle = '#b9ffd8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r || 10, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x - 8, p.y - 6);
      ctx.lineTo(p.x + 8, p.y + 6);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function step(dt) {
  if (battleOver) return;

  sukuna.update(dt);
  mahoraga.update(dt);

  if (sukuna.cooldown <= 0) {
    sukunaAbilities(mahoraga);
    sukuna.cooldown = rand(0.5, 1.25);
  }

  if (mahoraga.cooldown <= 0) {
    mahoragaAbilities(sukuna);
    mahoraga.cooldown = rand(0.55, 1.35);
  }

  // little body collisions make them bounce off each other
  if (rectsOverlap(sukuna, mahoraga)) {
    const tx = sukuna.vx;
    sukuna.vx = mahoraga.vx * 0.9;
    mahoraga.vx = tx * 0.9;
    sukuna.vy *= -0.9;
    mahoraga.vy *= -0.9;
  }

  updateProjectiles(dt);
  updateEffects(dt);

  hpS.textContent = Math.round(sukuna.hp);
  hpM.textContent = Math.round(mahoraga.hp);

  if (sukuna.hp <= 0 || mahoraga.hp <= 0) {
    battleOver = true;
    const winner = sukuna.hp > mahoraga.hp ? 'SUKUNA' : 'MAHORAGA';
    statusEl.textContent = `${winner} WINS! Click "Run New Battle" for a fresh random fight.`;
  }
}

function render() {
  drawArena();
  drawEffects();
  drawProjectiles();
  sukuna.draw();
  mahoraga.draw();
}

let prev = performance.now();
function loop(now) {
  const dt = Math.min((now - prev) / 1000, 0.035);
  prev = now;
  step(dt);
  render();
  requestAnimationFrame(loop);
}

function resetBattle() {
  Object.assign(sukuna, new Fighter('Sukuna', 120, '#7a1f1f'));
  Object.assign(mahoraga, new Fighter('Mahoraga', W - 220, '#204f32'));
  projectiles = [];
  effects = [];
  battleOver = false;
  statusEl.textContent = 'New battle started. Outcome is randomized.';
}

restartBtn.addEventListener('click', resetBattle);
requestAnimationFrame(loop);
