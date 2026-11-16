/* ============================================================
   Романтична мінігра — логіка
   Етапи: 0 привітання → 1 ловимо сердечка → 2 комплімент
          → 3 сюрприз → 4 фінал
   ============================================================ */
(() => {
  'use strict';

  /* ---------- Налаштування ---------- */
  const TOTAL_HEARTS = 5;
  const HEART_COLORS = ['#ff5c93', '#ff7aa8', '#b58cff', '#ff8fb8', '#f06ec0'];
  const HEART_PATH =
    'M23.6 0c-3.4 0-6.3 2.7-7.6 5.6C14.7 2.7 11.8 0 8.4 0 3.8 0 0 3.8 0 8.4c0 9.4 9.5 11.9 16 21.2 6.1-9.3 16-12.1 16-21.2C32 3.8 28.2 0 23.6 0z';

  const COMPLIMENTS = [
    'Твоя усмішка могла б освітлювати навіть найпохмуріший день ☀️',
    'Ти набагато крутіша, ніж сама думаєш ❤️',
    'Якби гарний настрій був людиною, це була б ти.',
    'Ти — моя улюблена причина усміхатися.',
    'Поруч із тобою навіть звичайний день стає особливим ✨',
    'У тебе такі теплі очі, що в них хочеться залишитися надовго 🥹',
    'Ти робиш світ трохи добрішим просто тим, що ти є 🌷',
    'Твій сміх — найкраща мелодія, яку я знаю 🎶',
    'Ти вмієш бути сильною і ніжною одночасно, і це неймовірно 💫'
  ];

  const REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WEAK = (navigator.hardwareConcurrency || 4) <= 4;

  /* ---------- Утиліти ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const timers = new Set();
  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers.clear();
  }

  function restartAnim(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // перезапуск CSS-анімації
    el.classList.add(cls);
  }

  /* ---------- SVG: котик ---------- */
  function catSVG(withHeart) {
    const edge = '#f3c9dc';
    return `
<svg class="cat" viewBox="0 0 200 200" role="img" aria-label="Милий котик">
  <g class="tail"><path d="M142 170c36-4 46-42 24-62" fill="none" stroke="${edge}" stroke-width="15" stroke-linecap="round"/></g>
  <ellipse cx="100" cy="152" rx="46" ry="38" fill="#fff" stroke="${edge}" stroke-width="3"/>
  ${withHeart ? '<use class="held" href="#heart" x="79" y="137" width="42" height="39" style="color:#ff5c93"/>' : ''}
  <ellipse class="arm arm-l" cx="66" cy="172" rx="13" ry="10" fill="#fff" stroke="${edge}" stroke-width="3"/>
  <ellipse class="arm arm-r" cx="134" cy="172" rx="13" ry="10" fill="#fff" stroke="${edge}" stroke-width="3"/>
  <g class="head">
    <path d="M50 76 L56 24 L93 51Z" fill="#fff" stroke="${edge}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M150 76 L144 24 L107 51Z" fill="#fff" stroke="${edge}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M60 62 L62 40 L80 53Z" fill="#ffc2d8"/>
    <path d="M140 62 L138 40 L120 53Z" fill="#ffc2d8"/>
    <ellipse cx="100" cy="86" rx="56" ry="48" fill="#fff" stroke="${edge}" stroke-width="3"/>
    <g class="eyes">
      <ellipse cx="76" cy="86" rx="6.5" ry="8.5" fill="#4a3560"/>
      <circle cx="78.2" cy="83" r="2.4" fill="#fff"/>
      <ellipse cx="124" cy="86" rx="6.5" ry="8.5" fill="#4a3560"/>
      <circle cx="126.2" cy="83" r="2.4" fill="#fff"/>
    </g>
    <ellipse cx="60" cy="104" rx="9" ry="6" fill="#ffb3cd" opacity=".75"/>
    <ellipse cx="140" cy="104" rx="9" ry="6" fill="#ffb3cd" opacity=".75"/>
    <path d="M95 97 h10 l-5 6z" fill="#ff7aa8" stroke="#ff7aa8" stroke-width="2" stroke-linejoin="round"/>
    <path d="M100 103 q-6 8 -13 3 M100 103 q6 8 13 3" stroke="#4a3560" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M44 92 l-16 -3 M44 100 l-16 3 M156 92 l16 -3 M156 100 l16 3" stroke="${edge}" stroke-width="2.4" stroke-linecap="round"/>
  </g>
</svg>`;
  }

  /* ---------- Канвас: частинки (сердечка, зірочки, конфеті) ---------- */
  const fx = (() => {
    const canvas = $('#fx');
    const ctx = canvas.getContext('2d');
    const heartPath = new Path2D(HEART_PATH);
    const COLORS = ['#ff7aa8', '#ff9ec0', '#c9a7ff', '#ffd1e3', '#b9c7ff', '#ffe08a', '#ffffff', '#ff5c93'];
    let parts = [];
    let running = false;
    let last = 0;
    let w = 0, h = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function kick() {
      if (!running) {
        running = true;
        last = performance.now();
        requestAnimationFrame(loop);
      }
    }

    function scaleCount(n) {
      const k = REDUCED ? 0.3 : (WEAK ? 0.6 : 1);
      return Math.max(3, Math.round(n * k));
    }

    function burst(x, y, n = 24) {
      n = scaleCount(n);
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2);
        const sp = rand(140, 460);
        parts.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 140,
          g: 620,
          drag: 0.985,
          rot: rand(0, 6.28),
          vr: rand(-8, 8),
          size: rand(9, 20),
          color: pick(COLORS),
          kind: pick(['heart', 'heart', 'star', 'conf', 'conf']),
          life: rand(0.9, 1.7),
          age: 0
        });
      }
      kick();
    }

    // Сердечка, що піднімаються знизу екрана
    function rise(n = 26) {
      n = scaleCount(n);
      for (let i = 0; i < n; i++) {
        parts.push({
          x: rand(0, w),
          y: h + rand(10, 80),
          vx: rand(-25, 25),
          vy: rand(-260, -130),
          g: 0,
          drag: 1,
          rot: rand(-0.5, 0.5),
          vr: rand(-1, 1),
          size: rand(14, 30),
          color: pick(COLORS.slice(0, 4).concat('#ff5c93')),
          kind: 'heart',
          life: rand(2.6, 4),
          age: -rand(0, 1.2)
        });
      }
      kick();
    }

    function drawStar(s) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s : s * 0.45;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    }

    function draw(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.kind === 'heart') {
        const k = p.size / 32;
        ctx.scale(k, k);
        ctx.translate(-16, -15);
        ctx.fill(heartPath);
      } else if (p.kind === 'star') {
        drawStar(p.size * 0.6);
      } else {
        ctx.fillRect(-p.size * 0.3, -p.size * 0.15, p.size * 0.6, p.size * 0.3);
      }
      ctx.restore();
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      ctx.clearRect(0, 0, w, h);
      const alive = [];
      for (const p of parts) {
        p.age += dt;
        if (p.age < 0) { alive.push(p); continue; }
        if (p.age >= p.life) continue;
        p.vy += p.g * dt;
        p.vx *= p.drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const remain = p.life - p.age;
        ctx.globalAlpha = Math.min(1, remain / 0.5);
        draw(p);
        alive.push(p);
      }
      ctx.globalAlpha = 1;
      parts = alive;
      if (parts.length) {
        requestAnimationFrame(loop);
      } else {
        running = false;
        ctx.clearRect(0, 0, w, h);
      }
    }

    function clear() {
      parts = [];
      ctx.clearRect(0, 0, w, h);
    }

    window.addEventListener('resize', resize);
    resize();
    return { burst, rise, clear };
  })();

  /* ---------- Прогрес ---------- */
  const bar = $('#bar');
  const progressEl = $('#progress');
  const stepLabel = $('#stepLabel');

  function setProgress(pct, stage) {
    bar.style.width = pct + '%';
    progressEl.setAttribute('aria-valuenow', String(Math.round(pct)));
    stepLabel.textContent = 'Етап ' + (stage + 1) + ' з 5';
  }

  /* ---------- Стан ---------- */
  const screens = $$('.screen');
  const state = {
    stage: 0,
    score: 0,
    spawned: 0,
    hearts: [],
    raf: 0,
    last: 0,
    queue: [],
    opened: false,
    countToken: 0
  };

  function go(n) {
    state.stage = n;
    screens.forEach((el, i) => el.classList.toggle('active', i === n));
    if (n !== 1) stopCatch();
    if (n === 0) setProgress(0, 0);
    if (n === 2) setProgress(55, 2);
    if (n === 3) setProgress(78, 3);
    if (n === 4) setProgress(100, 4);
    if (n === 1) { setProgress(10, 1); startCatch(); }
    if (n === 2) showCompliment();
    if (n === 3) setupSurprise();
    if (n === 4) setupFinale();
  }

  /* ---------- Етап 2: ловимо сердечка ---------- */
  const area = $('#catchArea');
  const dotsEl = $('#dots');
  const scoreText = $('#scoreText');

  function buildDots() {
    dotsEl.innerHTML = '';
    for (let i = 0; i < TOTAL_HEARTS; i++) dotsEl.appendChild(document.createElement('span'));
  }

  function updateScore() {
    $$('span', dotsEl).forEach((d, i) => d.classList.toggle('on', i < state.score));
    scoreText.textContent = state.score + ' з ' + TOTAL_HEARTS;
    setProgress(10 + (state.score / TOTAL_HEARTS) * 30, 1);
  }

  function spawnHeart() {
    if (state.spawned >= TOTAL_HEARTS) return;
    state.spawned++;
    const size = 64;
    const W = area.clientWidth || 300;
    const H = area.clientHeight || 400;
    const ang = rand(0, Math.PI * 2);
    const speed = rand(80, 130);
    const el = document.createElement('div');
    el.className = 'catch-heart';
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Спіймати сердечко');
    el.innerHTML = '<div class="pulse"><svg><use href="#heart"/></svg></div>';
    el.style.color = pick(HEART_COLORS);

    const obj = {
      el, size,
      x: rand(10, Math.max(20, W - size - 10)),
      y: rand(10, Math.max(20, H - size - 10)),
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      caught: false
    };
    el.style.transform = `translate3d(${obj.x}px, ${obj.y}px, 0)`;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      catchHeart(obj);
    });
    area.appendChild(el);
    state.hearts.push(obj);
  }

  function tick(now) {
    const dt = Math.min((now - state.last) / 1000, 0.05);
    state.last = now;
    const W = area.clientWidth;
    const H = area.clientHeight;
    for (const h of state.hearts) {
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      if (h.x < 0) { h.x = 0; h.vx = Math.abs(h.vx); }
      if (h.x > W - h.size) { h.x = W - h.size; h.vx = -Math.abs(h.vx); }
      if (h.y < 0) { h.y = 0; h.vy = Math.abs(h.vy); }
      if (h.y > H - h.size) { h.y = H - h.size; h.vy = -Math.abs(h.vy); }
      h.el.style.transform = `translate3d(${h.x.toFixed(1)}px, ${h.y.toFixed(1)}px, 0)`;
    }
    state.raf = requestAnimationFrame(tick);
  }

  function startCatch() {
    stopCatch();
    state.score = 0;
    state.spawned = 0;
    area.innerHTML = '';
    buildDots();
    updateScore();
    setProgress(10, 1);
    spawnHeart();
    later(() => { if (state.stage === 1) spawnHeart(); }, 600);
    state.last = performance.now();
    state.raf = requestAnimationFrame(tick);
  }

  function stopCatch() {
    cancelAnimationFrame(state.raf);
    state.raf = 0;
    state.hearts = [];
  }

  function catchHeart(obj) {
    if (obj.caught) return;
    obj.caught = true;
    state.hearts = state.hearts.filter((h) => h !== obj);
    obj.el.classList.add('caught');

    const rect = area.getBoundingClientRect();
    const cx = rect.left + obj.x + obj.size / 2;
    const cy = rect.top + obj.y + obj.size / 2;
    fx.burst(cx, cy, 14);

    const plus = document.createElement('div');
    plus.className = 'plus-one';
    plus.textContent = '+1';
    plus.style.left = obj.x + obj.size / 2 - 12 + 'px';
    plus.style.top = obj.y + 'px';
    area.appendChild(plus);
    later(() => { plus.remove(); obj.el.remove(); }, 800);

    state.score++;
    updateScore();

    if (state.score >= TOTAL_HEARTS) {
      later(() => go(2), 900);
    } else {
      later(() => { if (state.stage === 1) spawnHeart(); }, 300);
    }
  }

  /* ---------- Етап 3: комплімент ---------- */
  const complimentText = $('#complimentText');

  function nextCompliment() {
    if (!state.queue.length) {
      state.queue = COMPLIMENTS.slice().sort(() => Math.random() - 0.5);
    }
    return state.queue.pop();
  }

  function showCompliment() {
    complimentText.textContent = nextCompliment();
    restartAnim(complimentText, 'swap');
  }

  /* ---------- Етап 4: сюрприз ---------- */
  const giftBtn = $('#giftBtn');
  const surpriseMsg = $('#surpriseMsg');
  const toFinale = $('#toFinale');

  function setMsg(text) {
    surpriseMsg.textContent = text;
    restartAnim(surpriseMsg, 'swap');
  }

  function setupSurprise() {
    state.opened = false;
    giftBtn.classList.remove('open');
    toFinale.classList.add('hidden');
    toFinale.classList.remove('show');
    setMsg('Тут заховане дещо важливе...');
  }

  function openGift() {
    if (state.opened) return;
    state.opened = true;
    giftBtn.classList.add('open');

    const r = giftBtn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height * 0.45;
    fx.burst(x, y, 46);
    later(() => fx.burst(x - 50, y - 20, 24), 220);
    later(() => fx.burst(x + 50, y - 20, 24), 380);
    later(() => fx.rise(16), 500);

    later(() => setMsg('Я просто хотів нагадати тобі, що ти неймовірна. І навіть якщо сьогодні день не дуже — ти все одно заслуговуєш на найкращий настрій ❤️'), 900);
    later(() => {
      toFinale.classList.remove('hidden');
      toFinale.classList.add('show');
    }, 1900);
  }

  /* ---------- Етап 5: фінал ---------- */
  const photoFrame = $('#photoFrame');
  const photo = $('#photo');

  function animateCount(el, to, dur, token, delay) {
    const fmt = (v) => Math.round(v).toLocaleString('uk-UA').replace(/\u00a0/g, ' ');
    el.textContent = '0';
    later(() => {
      const t0 = performance.now();
      const step = (now) => {
        if (token !== state.countToken) return;
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
  }

  function setupFinale() {
    state.countToken++;
    const token = state.countToken;
    $$('.count').forEach((el, i) => {
      animateCount(el, Number(el.dataset.to), 1400, token, 500 + i * 250);
    });
    later(() => fx.rise(22), 300);
    later(() => fx.burst(window.innerWidth / 2, window.innerHeight * 0.3, 36), 500);
  }

  // Фото: якщо файлу photo.jpg немає — показуємо милу заглушку
  photo.addEventListener('error', () => photoFrame.classList.add('no-photo'));
  if (photo.complete && photo.naturalWidth === 0) photoFrame.classList.add('no-photo');

  /* ---------- Обійми ---------- */
  const hugOverlay = $('#hugOverlay');
  const hugCat = $('#hugCat');
  const hugText = $('#hugText');
  const HUG_LINES = [
    'Котик міцно-міцно тебе обіймає 🫂',
    'Обійми дійшли! Відчуваєш тепло? 🥰',
    'Це ще не все — обіймів завжди більше ❤️'
  ];
  let hugIndex = 0;

  function openHug() {
    hugCat.innerHTML = catSVG(true);
    hugText.textContent = HUG_LINES[hugIndex++ % HUG_LINES.length];
    hugOverlay.classList.add('show');
    hugOverlay.setAttribute('aria-hidden', 'false');
    const svg = $('.cat', hugCat);
    later(() => svg && svg.classList.add('cat--hug'), 350);
    later(() => fx.rise(30), 500);
    later(() => fx.burst(window.innerWidth / 2, window.innerHeight * 0.4, 40), 900);
    later(() => fx.rise(24), 1800);
  }

  function closeHug() {
    hugOverlay.classList.remove('show');
    hugOverlay.setAttribute('aria-hidden', 'true');
  }

  /* ---------- Перезапуск ---------- */
  function restart() {
    clearTimers();
    stopCatch();
    state.countToken++;
    fx.clear();
    closeHug();
    area.innerHTML = '';
    state.queue = [];
    state.opened = false;
    giftBtn.classList.remove('open');
    go(0);
  }

  /* ---------- Фонові сердечка ---------- */
  function buildBgHearts() {
    if (REDUCED) return;
    const wrap = $('#bgHearts');
    const n = WEAK ? 5 : 9;
    const colors = ['#ffb3cd', '#d8c7ff', '#ffc9dd', '#c9d6ff'];
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      const size = rand(14, 30);
      s.className = 'bg-heart';
      s.style.left = rand(2, 96) + '%';
      s.style.width = s.style.height = size + 'px';
      s.style.color = pick(colors);
      s.style.setProperty('--dx', rand(-40, 40) + 'px');
      s.style.animationDuration = rand(9, 17) + 's';
      s.style.animationDelay = -rand(0, 14) + 's';
      s.innerHTML = '<svg><use href="#heart"/></svg>';
      wrap.appendChild(s);
    }
  }

  /* ---------- Ініціалізація ---------- */
  function init() {
    $$('[data-cat]').forEach((el) => {
      el.innerHTML = catSVG(el.dataset.cat === 'hold');
    });
    buildBgHearts();
    buildDots();

    $('#startBtn').addEventListener('click', (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      fx.burst(r.left + r.width / 2, r.top + r.height / 2, 18);
      later(() => go(1), 350);
    });
    $('#moreBtn').addEventListener('click', (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      fx.burst(r.left + r.width / 2, r.top, 10);
      showCompliment();
    });
    $('#toSurprise').addEventListener('click', () => go(3));
    giftBtn.addEventListener('click', openGift);
    toFinale.addEventListener('click', () => go(4));
    $('#hugBtn').addEventListener('click', openHug);
    $('#hugClose').addEventListener('click', closeHug);
    hugOverlay.addEventListener('click', (e) => { if (e.target === hugOverlay) closeHug(); });
    $('#restartBtn').addEventListener('click', restart);
    $('#restartTop').addEventListener('click', restart);

    // Не даємо сторінці «стрибати» від подвійного тапу
    document.addEventListener('dblclick', (e) => e.preventDefault());

    // Пауза анімації сердечок, коли вкладка прихована
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(state.raf);
      } else if (state.stage === 1 && state.hearts.length) {
        state.last = performance.now();
        state.raf = requestAnimationFrame(tick);
      }
    });

    go(0);
  }

  init();
})();