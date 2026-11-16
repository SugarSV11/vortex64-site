(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('visible');
      io.unobserve(el);
      // drop the stagger delay once revealed so hover transitions stay instant
      setTimeout(() => { el.style.transitionDelay = ''; }, 1100);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    io.observe(el);
  });

  /* ---------- top bar + progress ---------- */
  const topbar = $('#topbar');
  const progress = $('#progress');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      topbar.classList.toggle('scrolled', y > 10);
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      ticking = false;
    });
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- active nav link ---------- */
  const navLinks = $$('.nav a[href^="#"]');
  const sectionIO = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(a => { const s = $(a.getAttribute('href')); if (s) sectionIO.observe(s); });

  /* ---------- mobile menu ---------- */
  const nav = $('#nav');
  const menuBtn = $('#menuBtn');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar navegación' : 'Abrir navegación');
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- hero: spotlight + 3D tilt ---------- */
  const hero = $('#hero');
  const tilt = $('#tilt');
  if (finePointer && !reduce) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
      hero.style.setProperty('--my', `${e.clientY - r.top}px`);
      const v = tilt.getBoundingClientRect();
      const px = (e.clientX - (v.left + v.width / 2)) / innerWidth;
      const py = (e.clientY - (v.top + v.height / 2)) / innerHeight;
      tilt.style.setProperty('--ry', `${-7 + px * 14}deg`);
      tilt.style.setProperty('--rx', `${3 - py * 10}deg`);
    });
    hero.addEventListener('pointerleave', () => {
      tilt.style.removeProperty('--ry');
      tilt.style.removeProperty('--rx');
    });
  }

  /* ---------- hero: screenshot slideshow ---------- */
  const slides = $$('#heroScreen img');
  const dotsBox = $('#heroDots');
  let slide = 0, slideTimer;
  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Captura ${i + 1}`);
    b.tabIndex = -1;
    b.addEventListener('click', () => { show(i); restart(); });
    dotsBox.appendChild(b);
    return b;
  });
  function show(i) {
    slides[slide].classList.remove('on'); dots[slide].classList.remove('on');
    slide = (i + slides.length) % slides.length;
    slides[slide].classList.add('on'); dots[slide].classList.add('on');
  }
  function restart() {
    clearInterval(slideTimer);
    if (!reduce) slideTimer = setInterval(() => show(slide + 1), 4500);
  }
  dots[0].classList.add('on');
  restart();
  document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(slideTimer) : restart());

  /* ---------- count up ---------- */
  $$('.count').forEach(el => {
    if (reduce) return;
    const to = +el.dataset.to;
    el.textContent = '0';
    const cio = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      cio.disconnect();
      const t0 = performance.now(), dur = 1400;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    cio.observe(el);
  });

  /* ---------- glow cards (cursor spotlight) ---------- */
  if (finePointer) {
    $$('.card, .step, .spec').forEach(el => {
      el.classList.add('glow');
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--gx', `${e.clientX - r.left}px`);
        el.style.setProperty('--gy', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduce) {
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        b.style.transform = `translate(${x}px, ${y}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- typed code with highlight ---------- */
  const typed = $('#typed');
  const src = typed.dataset.code;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const highlight = (s) => esc(s)
    .replace(/(\/\/[^\n]*)/g, '<span class="t-c">$1</span>')
    .replace(/\b(0x[0-9a-fA-F]+)\b/g, '<span class="t-n">$1</span>')
    .replace(/\b(console|events|pj64)\b/g, '<span class="t-k">$1</span>')
    .replace(/\.(log|onexec|romInfo|goodName)\b/g, '.<span class="t-f">$1</span>');
  if (reduce) {
    typed.innerHTML = highlight(src);
  } else {
    typed.innerHTML = '<span class="caret"></span>';
    const tio = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      tio.disconnect();
      let i = 0;
      const tick = () => {
        i += 1;
        typed.innerHTML = highlight(src.slice(0, i)) + '<span class="caret"></span>';
        if (i < src.length) setTimeout(tick, src[i - 1] === '\n' ? 220 : 26);
      };
      setTimeout(tick, 300);
    }, { threshold: 0.6 });
    tio.observe(typed);
  }

  /* ---------- UI tour tabs ---------- */
  const tour = $('.tour');
  const tabs = $$('.tab');
  const tourImgs = $$('#tourStage img');
  const tourTitle = $('#tourTitle');
  const names = ['Biblioteca', 'Ajustes', 'Gráficos'];
  let tab = 0, tourTimer;
  function setTab(i) {
    tab = (i + tabs.length) % tabs.length;
    tabs.forEach((t, k) => {
      t.classList.toggle('active', k === tab);
      t.setAttribute('aria-selected', String(k === tab));
    });
    // restart progress bar animation
    const a = tabs[tab]; a.classList.remove('active'); void a.offsetWidth; a.classList.add('active');
    tourImgs.forEach((im, k) => im.classList.toggle('on', k === tab));
    tourTitle.textContent = `Vortex64 — ${names[tab]}`;
  }
  function tourPlay() {
    clearInterval(tourTimer);
    if (!reduce) tourTimer = setInterval(() => { if (!tour.classList.contains('paused')) setTab(tab + 1); }, 6000);
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => { setTab(i); tourPlay(); }));
  tour.addEventListener('pointerenter', () => tour.classList.add('paused'));
  tour.addEventListener('pointerleave', () => tour.classList.remove('paused'));
  $('.tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    setTab(tab + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1));
    tabs[tab].focus(); tourPlay();
  });
  tourPlay();

  /* ---------- gallery filters ---------- */
  const shots = $$('.shot');
  $$('.filter').forEach(f => f.addEventListener('click', () => {
    $$('.filter').forEach(x => x.classList.toggle('active', x === f));
    const k = f.dataset.filter;
    shots.forEach(s => s.classList.toggle('hidden', k !== 'all' && s.dataset.kind !== k));
  }));

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCount = $('#lbCount');
  let list = [], idx = 0, lastShot = null;
  const visibleShots = () => shots.filter(s => !s.classList.contains('hidden'));
  function render() {
    const s = list[idx];
    lbImg.src = s.dataset.src;
    lbImg.alt = $('img', s).alt;
    lbCap.textContent = s.dataset.cap || '';
    lbCount.textContent = `${idx + 1} / ${list.length}`;
    lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
  }
  function openLb(s) {
    list = visibleShots(); idx = list.indexOf(s); lastShot = s;
    render();
    lb.hidden = false;
    document.body.classList.add('lb-open');
    $('#lbClose').focus();
  }
  function closeLb() {
    lb.hidden = true; lbImg.src = '';
    document.body.classList.remove('lb-open');
    if (lastShot) lastShot.focus();
  }
  const go = (d) => { idx = (idx + d + list.length) % list.length; render(); };
  shots.forEach(s => s.addEventListener('click', () => openLb(s)));
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => go(-1));
  $('#lbNext').addEventListener('click', () => go(1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false);
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'Tab') { // keep focus inside dialog
      const f = $$('.lb-btn', lb);
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  let tx = null;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    tx = null;
  });

  /* ---------- copy CLI command ---------- */
  const toast = $('#toast');
  let toastT;
  const say = (msg) => {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 1800);
  };
  const copyBtn = $('#copyBtn');
  copyBtn.addEventListener('click', async () => {
    const text = $('#cliCmd').textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement('textarea');
      t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch {}
      t.remove();
    }
    copyBtn.classList.add('done');
    $('span', copyBtn).textContent = 'Copiado';
    $('use', copyBtn).setAttribute('href', '#i-check');
    say('Comando copiado al portapapeles');
    setTimeout(() => {
      copyBtn.classList.remove('done');
      $('span', copyBtn).textContent = 'Copiar';
      $('use', copyBtn).setAttribute('href', '#i-copy');
    }, 1800);
  });

  /* ---------- platform switch ---------- */
  const builds = {
    windows: {
      label: 'Windows', status: 'Compilación para Windows seleccionada',
      hint: 'Elige tu plataforma. Descomprime, ejecuta <code>vortex64.exe</code> y listo: el runtime de Visual C++ ya va incluido.',
      download: 'https://github.com/SugarSV11/Vortex64-Windows/releases/download/v1.0.0/Vortex64-Windows-x64.zip',
      file: 'Vortex64-Windows-x64.zip',
      source: 'https://github.com/SugarSV11/Vortex64-Windows/archive/refs/heads/main.zip',
      repo: 'https://github.com/SugarSV11/Vortex64-Windows'
    },
    linux: {
      label: 'Linux', status: 'Compilación para Linux seleccionada',
      hint: 'Elige tu plataforma. Descarga la <code>AppImage</code>, dale permiso de ejecución y ábrela: no hace falta instalar nada.',
      download: 'https://github.com/SugarSV11/Vortex64/releases/download/v1.0.0/Vortex64-1.0.0-x86_64.AppImage',
      file: 'Vortex64-1.0.0-x86_64.AppImage',
      source: 'https://github.com/SugarSV11/Vortex64/archive/refs/heads/main.zip',
      repo: 'https://github.com/SugarSV11/Vortex64'
    }
  };
  const sw = $('.switch');
  function selectPlatform(p) {
    const b = builds[p];
    sw.dataset.on = p;
    $$('.opt').forEach(o => {
      const on = o.dataset.platform === p;
      o.classList.toggle('active', on);
      o.setAttribute('aria-pressed', String(on));
    });
    $('#status').textContent = b.status;
    $('#dlHint').innerHTML = b.hint;
    $('#dlBtn').href = b.download;
    $('#dlBtn').setAttribute('download', b.file);
    $('#dlLabel').textContent = `Descargar para ${b.label}`;
    $('#srcLink').href = b.source;
    $('#repoLink').href = b.repo;
  }
  $$('.opt').forEach(o => o.addEventListener('click', () => selectPlatform(o.dataset.platform)));
  $('#dlBtn').addEventListener('click', () => say(`Descargando ${builds[sw.dataset.on].file}…`));
  const hint = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  selectPlatform(/linux/i.test(hint) && !/android/i.test(navigator.userAgent) ? 'linux' : 'windows');

  /* ---------- cartridge tilt ---------- */
  const dlCard = $('#dlCard'), cart = $('#cart');
  if (finePointer && !reduce) {
    dlCard.addEventListener('pointermove', (e) => {
      const r = cart.getBoundingClientRect();
      const px = (e.clientX - (r.left + r.width / 2)) / r.width;
      const py = (e.clientY - (r.top + r.height / 2)) / r.height;
      cart.style.setProperty('--cy', `${Math.max(-1, Math.min(1, px)) * 18}deg`);
      cart.style.setProperty('--cx', `${Math.max(-1, Math.min(1, -py)) * 14}deg`);
    });
    dlCard.addEventListener('pointerleave', () => {
      cart.style.removeProperty('--cy'); cart.style.removeProperty('--cx');
    });
  }
})();
