const canvas = document.getElementById('arena');
const ctx = canvas.getContext('2d');
const logEl = document.getElementById('log');
const hpS = document.getElementById('hp-sukuna');
const hpM = document.getElementById('hp-mahoraga');
const hpSText = document.getElementById('hp-sukuna-text');
const hpMText = document.getElementById('hp-mahoraga-text');

actionLog('Fight starts!');

const img = {
  sukuna: loadImg('assets/sukuna.svg'),
  mahoraga: loadImg('assets/mahoraga.svg'),
  shrine: loadImg('assets/shrine.svg'),
  handsign: loadImg('assets/handsign.svg')
};

let projectiles = [];
let effects = [];
let domain = null;
let winner = null;

function makeFighter(name, x, y) {
  return {
    name,
    x,
    y,
    r: 36,
    hp: 1000,
    maxHp: 1000,
    vx: (Math.random() * 2 + 1.4) * (Math.random() < 0.5 ? -1 : 1),
    vy: (Math.random() * 2 + 1.2) * (Math.random() < 0.5 ? -1 : 1),
    abilityCd: 0,
    inv: 0,
    glow: 0,
    adaptations: new Map(),
    resist: {}
  };
}

let sukuna;
let mahoraga;

function resetFight() {
  projectiles = [];
  effects = [];
  domain = null;
  winner = null;
  sukuna = makeFighter('sukuna', 160, 280);
  mahoraga = makeFighter('mahoraga', 740, 280);
  actionLog('New battle. Random chaos enabled.');
}

document.getElementById('restart').addEventListener('click', resetFight);
resetFight();

function loadImg(src) {
  const i = new Image();
  i.src = src;
  return i;
}

function actionLog(t) {
  logEl.textContent = t;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function dealDamage(target, amount, type) {
  if (target.inv > 0 || winner) return;
  const reduced = target.resist[type] ? amount * target.resist[type] : amount;
  target.hp = Math.max(0, target.hp - reduced);
  target.inv = 5;

  if (target === mahoraga) {
    const c = (mahoraga.adaptations.get(type) || 0) + reduced;
    mahoraga.adaptations.set(type, c);
    if (c > 130 && !mahoraga.resist[type]) {
      mahoraga.resist[type] = 0.68;
      mahoraga.glow = 26;
      actionLog(`Mahoraga adapted to ${type}!`);
    }
  }

  if (target.hp <= 0 && !winner) {
    winner = target === sukuna ? 'Mahoraga' : 'Sukuna';
    actionLog(`${winner} wins!`);
  }
}

function spawnProjectile(p) {
  projectiles.push({ life: 220, ...p });
}

function slashBurst(from, to) {
  for (let i = 0; i < 6; i++) {
    const ang = Math.atan2(to.y - from.y, to.x - from.x) + (Math.random() - 0.5) * 0.55;
    const spd = 5 + Math.random() * 2;
    spawnProjectile({
      x: from.x,
      y: from.y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      color: '#ffffff',
      dmg: 24,
      radius: 4,
      owner: 'sukuna',
      type: 'slash'
    });
  }
  effects.push({ kind: 'flash', x: from.x, y: from.y, t: 14, color: '#ff9898' });
  actionLog('Sukuna used Dismantle barrage!');
}

function fuga(from, to) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  spawnProjectile({
    x: from.x,
    y: from.y,
    vx: Math.cos(ang) * 4.1,
    vy: Math.sin(ang) * 4.1,
    color: '#ff9a00',
    dmg: 70,
    radius: 9,
    owner: 'sukuna',
    type: 'fuga',
    explosive: true
  });
  actionLog('Sukuna launched Fuga!');
}

function activateDomain() {
  domain = { t: 160 };
  effects.push({ kind: 'flash', x: canvas.width / 2, y: canvas.height / 2, t: 28, color: '#ff3b3b' });
  actionLog('Malevolent Shrine activated!');
}

function mahoragaWheel(from) {
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5;
    spawnProjectile({
      x: from.x + Math.cos(a) * 36,
      y: from.y + Math.sin(a) * 36,
      ang: a,
      orbitOwner: 'mahoraga',
      orbitRadius: 36,
      orbitTime: 48,
      radius: 5,
      color: '#c6ff52',
      dmg: 18,
      owner: 'mahoraga',
      type: 'wheel'
    });
  }
  actionLog('Mahoraga wheel barrier spun up!');
}

function mahoragaSlash(from, to) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  spawnProjectile({
    x: from.x,
    y: from.y,
    vx: Math.cos(ang) * 5.4,
    vy: Math.sin(ang) * 5.4,
    color: '#9fff8f',
    dmg: 34,
    radius: 6,
    owner: 'mahoraga',
    type: 'sword'
  });
  actionLog('Mahoraga launched sword arc!');
}

function updateFighter(f, enemy) {
  if (winner) return;
  f.x += f.vx;
  f.y += f.vy;

  if (f.x - f.r < 0 || f.x + f.r > canvas.width) f.vx *= -1;
  if (f.y - f.r < 0 || f.y + f.r > canvas.height) f.vy *= -1;
  f.x = clamp(f.x, f.r, canvas.width - f.r);
  f.y = clamp(f.y, f.r, canvas.height - f.r);

  const dx = enemy.x - f.x;
  const dy = enemy.y - f.y;
  const d = Math.hypot(dx, dy);
  if (d < f.r + enemy.r + 10) {
    f.vx -= (dx / d) * 0.18;
    f.vy -= (dy / d) * 0.18;
  }

  f.vx = clamp(f.vx, -4, 4);
  f.vy = clamp(f.vy, -4, 4);

  f.abilityCd -= 1;
  f.inv = Math.max(0, f.inv - 1);
  f.glow = Math.max(0, f.glow - 1);

  if (f.abilityCd <= 0) {
    if (f === sukuna) {
      const r = Math.random();
      if (r < 0.16 && !domain) activateDomain();
      else if (r < 0.54) slashBurst(f, enemy);
      else fuga(f, enemy);
      f.abilityCd = 40 + Math.random() * 34;
    } else {
      if (Math.random() < 0.48) mahoragaWheel(f);
      else mahoragaSlash(f, enemy);
      f.abilityCd = 36 + Math.random() * 30;
    }
  }
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    if (p.orbitOwner && p.orbitTime > 0) {
      p.orbitTime -= 1;
      p.ang += 0.15;
      p.x = mahoraga.x + Math.cos(p.ang) * p.orbitRadius;
      p.y = mahoraga.y + Math.sin(p.ang) * p.orbitRadius;
      if (p.orbitTime <= 0) {
        const ang = Math.atan2(sukuna.y - mahoraga.y, sukuna.x - mahoraga.x) + (Math.random() - 0.5) * 0.35;
        p.vx = Math.cos(ang) * 5.2;
        p.vy = Math.sin(ang) * 5.2;
      }
    } else {
      p.x += p.vx;
      p.y += p.vy;
    }

    p.life -= 1;
    if (p.x < -30 || p.y < -30 || p.x > canvas.width + 30 || p.y > canvas.height + 30 || p.life < 0) {
      projectiles.splice(i, 1);
      continue;
    }

    const target = p.owner === 'sukuna' ? mahoraga : sukuna;
    const dist = Math.hypot(target.x - p.x, target.y - p.y);
    if (dist < target.r + p.radius) {
      dealDamage(target, p.dmg, p.type);
      if (p.explosive) {
        effects.push({ kind: 'boom', x: p.x, y: p.y, t: 24 });
        dealDamage(target, 24, 'burn');
      }
      projectiles.splice(i, 1);
    }
  }
}

function updateDomain() {
  if (!domain || winner) return;
  domain.t -= 1;
  if (domain.t % 12 === 0) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    effects.push({ kind: 'slash', x, y, t: 10 });
    if (Math.random() < 0.65) dealDamage(mahoraga, 19, 'domain');
  }
  if (domain.t <= 0) {
    domain = null;
    actionLog('Domain collapsed.');
  }
}

function drawFighter(f) {
  const sprite = f === sukuna ? img.sukuna : img.mahoraga;
  const w = 92;
  const h = 92;
  if (f.glow > 0) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#d8ff7f';
    ctx.beginPath();
    ctx.arc(f.x, f.y, 58 + Math.sin(f.glow * 0.7) * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (sprite.complete) ctx.drawImage(sprite, f.x - w / 2, f.y - h / 2, w, h);
  else {
    ctx.fillStyle = f === sukuna ? '#ff6666' : '#8aff66';
    ctx.fillRect(f.x - w / 2, f.y - h / 2, w, h);
  }

  if (domain && f === sukuna && img.handsign.complete) {
    ctx.drawImage(img.handsign, f.x + 18, f.y - 56, 30, 30);
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEffects() {
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    e.t -= 1;
    if (e.t <= 0) {
      effects.splice(i, 1);
      continue;
    }

    if (e.kind === 'flash') {
      ctx.save();
      ctx.globalAlpha = e.t / 28;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 60 - e.t, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (e.kind === 'boom') {
      ctx.save();
      ctx.globalAlpha = e.t / 24;
      ctx.fillStyle = '#ff8c1a';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 40 - e.t * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (e.kind === 'slash') {
      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.globalAlpha = e.t / 10;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(e.x - 12, e.y - 12);
      ctx.lineTo(e.x + 12, e.y + 12);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function updateHud() {
  hpS.style.width = `${(sukuna.hp / sukuna.maxHp) * 100}%`;
  hpM.style.width = `${(mahoraga.hp / mahoraga.maxHp) * 100}%`;
  hpSText.textContent = `${Math.ceil(sukuna.hp)}`;
  hpMText.textContent = `${Math.ceil(mahoraga.hp)}`;
}

function drawArena() {
  if (domain) {
    ctx.fillStyle = '#802121';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (img.shrine.complete) {
      ctx.globalAlpha = 0.8;
      ctx.drawImage(img.shrine, canvas.width / 2 - 75, canvas.height / 2 - 85, 150, 170);
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.fillStyle = '#4cc7ef';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function loop() {
  drawArena();
  updateFighter(sukuna, mahoraga);
  updateFighter(mahoraga, sukuna);
  updateProjectiles();
  updateDomain();
  drawProjectiles();
  drawEffects();
  drawFighter(sukuna);
  drawFighter(mahoraga);
  updateHud();
  requestAnimationFrame(loop);
}
loop();
