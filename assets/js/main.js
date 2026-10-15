/* Media Puppies — site runtime (vanilla JS, no dependencies)
   Handles: scroll reveals, counters, 3D tilt, magnetic buttons,
   scroll progress, nav behaviour, hero parallax, accordion motion,
   style-hover attribute.

   Motion here is interpolated frame by frame rather than set directly on
   each event, which is what makes the tilt and the magnetic buttons feel
   weighted instead of twitchy. Everything respects prefers-reduced-motion
   and everything degrades to a static page if this file never runs. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
  function lerp(a, b, t) { return a + (b - a) * t; }
  document.documentElement.classList.add('mp-ready');

  /* ---- style-hover="prop:val;..." (inline hover styles) ---- */
  document.querySelectorAll('[style-hover]').forEach(function (el) {
    var rules = el.getAttribute('style-hover').split(';').map(function (r) {
      var i = r.indexOf(':');
      return i > -1 ? [r.slice(0, i).trim(), r.slice(i + 1).trim()] : null;
    }).filter(Boolean);
    var saved = {};
    el.addEventListener('mouseenter', function () {
      rules.forEach(function (r) {
        saved[r[0]] = el.style.getPropertyValue(r[0]);
        el.style.setProperty(r[0], r[1]);
      });
    });
    el.addEventListener('mouseleave', function () {
      rules.forEach(function (r) { el.style.setProperty(r[0], saved[r[0]] || ''); });
    });
  });

  /* ---- Counter animation ---- */
  function runCounter(el) {
    if (el._counted) return;
    el._counted = true;
    var target = parseInt(el.dataset.count, 10) || 0;
    var dur = 1400, t0 = performance.now();
    (function tick(t) {
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) raf(tick);
    })(t0);
  }

  /* ---- Directional reveals ---- */
  var dirMap = {
    up: 'translateY(32px)',
    left: 'translateX(-44px)',
    right: 'translateX(44px)',
    zoom: 'scale(.94) translateY(20px)'
  };
  var els = document.querySelectorAll('[data-reveal]');
  if (!reduce) {
    /* Anything already on screen at load must NOT start at opacity 0 — it is
       usually the LCP element, and hiding it until this script runs pushes
       Largest Contentful Paint out by seconds. Animate the rest. */
    var vh = window.innerHeight || 0;
    els = Array.prototype.filter.call(els, function (el) {
      return el.getBoundingClientRect().top >= vh * 0.9;
    });
    els.forEach(function (el) {
      var dir = el.dataset.rev || 'up';
      el.style.opacity = '0';
      el.style.transform = dirMap[dir] || dirMap.up;
      el.style.filter = 'blur(6px)';
      el.style.willChange = 'opacity, transform';
      el.style.transition = 'opacity .7s ease, transform .85s cubic-bezier(.16,1,.3,1), filter .6s ease';
      el.style.transitionDelay = (parseInt(el.dataset.reveal, 10) || 0) + 'ms';
      el.setAttribute('data-reveal-pending', '');
    });
    document.querySelectorAll('[data-count]').forEach(function (c) {
      if (c.getBoundingClientRect().top < vh * 0.9) runCounter(c);
    });
    function show(el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
      el.removeAttribute('data-reveal-pending');
      el.querySelectorAll('[data-count]').forEach(runCounter);
      if (el.hasAttribute('data-count')) runCounter(el);
      setTimeout(function () {
        el.style.filter = '';
        el.style.willChange = '';
        el.style.transitionDelay = '0ms';
      }, 1100 + (parseInt(el.dataset.reveal, 10) || 0));
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        show(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -48px 0px' });
    els.forEach(function (el) { io.observe(el); });
    /* Safety net: if the observer never fires for an element that is on
       screen (background tab, throttled frame), reveal it anyway. */
    function sweep() {
      var h = window.innerHeight || 0;
      document.querySelectorAll('[data-reveal-pending]').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < h && r.bottom > 0) { show(el); io.unobserve(el); }
      });
    }
    setTimeout(sweep, 1500);
    window.addEventListener('scroll', function () { setTimeout(sweep, 900); }, { passive: true });
  } else {
    document.querySelectorAll('[data-count]').forEach(function (c) {
      c.textContent = c.dataset.count;
    });
  }

  /* ---- 3D tilt on cards, interpolated ---- */
  if (fine && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var tx = 0, ty = 0, cx = 0, cy = 0, lift = 0, cl = 0, on = false, running = false;
      function frame() {
        cx = lerp(cx, tx, 0.14); cy = lerp(cy, ty, 0.14); cl = lerp(cl, lift, 0.14);
        card.style.transform = 'perspective(1000px) rotateX(' + cy.toFixed(2) + 'deg) rotateY(' +
          cx.toFixed(2) + 'deg) translateY(' + (-6 * cl).toFixed(2) + 'px) scale(' + (1 + 0.012 * cl).toFixed(4) + ')';
        card.style.boxShadow = cl > 0.02
          ? '0 ' + (14 + 18 * cl).toFixed(1) + 'px ' + (34 + 30 * cl).toFixed(1) + 'px rgba(24,28,79,' + (0.08 + 0.1 * cl).toFixed(3) + ')'
          : '';
        var settled = !on && Math.abs(cx) < 0.05 && Math.abs(cy) < 0.05 && cl < 0.01;
        if (settled) { card.style.transform = ''; card.style.boxShadow = ''; running = false; return; }
        raf(frame);
      }
      function start() { if (!running) { running = true; raf(frame); } }
      card.addEventListener('mouseenter', function () { on = true; lift = 1; card.style.transition = 'none'; start(); });
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        tx = (x - 0.5) * 10; ty = (0.5 - y) * 7;
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        start();
      });
      card.addEventListener('mouseleave', function () { on = false; tx = 0; ty = 0; lift = 0; start(); });
    });
  }

  /* ---- Magnetic buttons, interpolated ---- */
  if (fine && !reduce) {
    document.querySelectorAll('[data-magnet]').forEach(function (btn) {
      var tx = 0, ty = 0, cx = 0, cy = 0, on = false, running = false;
      function frame() {
        cx = lerp(cx, tx, 0.18); cy = lerp(cy, ty, 0.18);
        btn.style.transform = 'translate(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px)';
        if (!on && Math.abs(cx) < 0.05 && Math.abs(cy) < 0.05) { btn.style.transform = ''; running = false; return; }
        raf(frame);
      }
      function start() { if (!running) { running = true; raf(frame); } }
      btn.addEventListener('mouseenter', function () { on = true; btn.style.transition = 'box-shadow .35s ease, background-color .25s ease, border-color .2s ease, color .2s ease, filter .2s ease'; });
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 12;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 9;
        start();
      });
      btn.addEventListener('mouseleave', function () { on = false; tx = 0; ty = 0; start(); });
    });
  }

  /* ---- Accordions: animate <details> instead of snapping ---- */
  if (!reduce && 'animate' in Element.prototype) {
    document.querySelectorAll('details').forEach(function (d) {
      var s = d.querySelector('summary');
      if (!s) return;
      s.addEventListener('click', function (e) {
        e.preventDefault();
        if (d.classList.contains('is-animating')) return;
        d.classList.add('is-animating');
        /* Animations pause in a background tab; never leave the block locked. */
        setTimeout(function () { d.style.height = ''; d.classList.remove('is-animating'); }, 700);
        var from = d.offsetHeight;
        if (d.open) {
          d.style.height = from + 'px';
          var toClosed = s.offsetHeight + parseFloat(getComputedStyle(d).paddingTop || 0) + parseFloat(getComputedStyle(d).paddingBottom || 0);
          d.animate([{ height: from + 'px' }, { height: toClosed + 'px' }], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' })
            .onfinish = function () { d.open = false; d.style.height = ''; d.classList.remove('is-animating'); };
        } else {
          d.open = true;
          var to = d.offsetHeight;
          d.style.height = from + 'px';
          d.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' })
            .onfinish = function () { d.style.height = ''; d.classList.remove('is-animating'); };
          var p = d.querySelector('p');
          if (p) p.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 90, easing: 'ease-out' });
        }
      });
    });
  }

  /* ---- Hero glow follows the cursor (home only) ---- */
  var hero = document.querySelector('header#top');
  if (hero && fine && !reduce) {
    var glow = document.createElement('div');
    glow.className = 'mp-glow';
    glow.setAttribute('aria-hidden', 'true');
    hero.insertBefore(glow, hero.firstChild);
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      glow.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      glow.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  }

  /* ---- Scroll: progress bar, nav, parallax, hero 3D layer ---- */
  var progress = document.querySelector('[data-progress]');
  var nav = document.querySelector('[data-nav]');
  var layer = document.querySelector('[data-layer]');
  var paras = document.querySelectorAll('[data-para]');
  var mx = 0, my = 0, smx = 0, smy = 0, sy = 0, lastY = 0, ticking = false, idle = true;

  /* Nav state is decided in the scroll handler itself, not in a frame
     callback: frames are throttled in background tabs and the bar would
     otherwise react late or in the wrong order. */
  var down = 0;
  function navState(y) {
    if (!nav) return;
    var delta = y - lastY;
    lastY = y;
    nav.classList.toggle('is-scrolled', y > 12);
    nav.style.boxShadow = y > 12 ? '0 10px 30px rgba(24,28,79,.06)' : 'none';
    if (y <= 260 || delta < -4) { down = 0; nav.classList.remove('is-hidden'); return; }
    if (delta > 0) down += delta;
    if (down > 28) nav.classList.add('is-hidden');
  }

  function update() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (sy / max) * 100 : 0) + '%';
    if (!reduce) {
      paras.forEach(function (p) {
        var f = parseFloat(p.dataset.para) || 0;
        p.style.transform = 'translateY(' + (sy * f).toFixed(1) + 'px)';
      });
    }
  }
  function requestUpdate() { if (!ticking) { ticking = true; raf(update); } }

  /* The hero layer eases towards the cursor rather than tracking it. */
  function layerFrame() {
    smx = lerp(smx, mx, 0.06); smy = lerp(smy, my, 0.06);
    if (layer && !reduce) {
      layer.style.transform = 'rotateY(' + (smx * 7).toFixed(2) + 'deg) rotateX(' + (-smy * 5).toFixed(2) + 'deg) translateY(' + (sy * -0.05).toFixed(1) + 'px)';
    }
    idle = Math.abs(smx - mx) < 0.001 && Math.abs(smy - my) < 0.001;
    if (!idle) raf(layerFrame);
  }

  window.addEventListener('scroll', function () {
    sy = window.scrollY; navState(sy); requestUpdate();
    if (layer && idle) { idle = false; raf(layerFrame); }
  }, { passive: true });
  if (fine) {
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      if (layer && idle) { idle = false; raf(layerFrame); }
    }, { passive: true });
  }
  sy = window.scrollY; lastY = sy; navState(sy); update();

  /* Pixel helpers (window.mpTrack / data-track) live in pixel.js */
})();
