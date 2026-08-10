// ============================================================
//  Flow field — a self-contained, dependency-free canvas animation.
//  Particles drift along an evolving sine-based vector field and
//  react to the cursor. Theme-aware, reduced-motion aware, and
//  paused when the hero is off-screen. Attach to a <canvas data-flowfield>.
// ============================================================
(() => {
  "use strict";

  const canvas = document.querySelector("[data-flowfield]");
  if (!canvas) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const root = document.documentElement;
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR for GPU/CPU sanity

  let width = 0, height = 0;
  let particles = [];
  let running = false;
  let rafId = null;
  let time = 0;

  // Colors are read from CSS custom properties so the field matches the theme.
  let accent = "#ff6a3c";
  let bg = "#0c0b0a";

  const readColors = () => {
    const styles = getComputedStyle(root);
    accent = (styles.getPropertyValue("--accent") || accent).trim();
    bg = (styles.getPropertyValue("--bg") || bg).trim();
  };

  // Pointer state (in CSS pixels, relative to the canvas)
  const pointer = { x: -9999, y: -9999, active: false };

  const PARTICLE_TARGET = 90; // kept low on purpose — this is ambience, not a demo
  let count = PARTICLE_TARGET;

  const rand = (min, max) => min + Math.random() * (max - min);

  const makeParticle = () => ({
    x: rand(0, width),
    y: rand(0, height),
    vx: 0,
    vy: 0,
    life: rand(0, 1),
  });

  const seed = () => {
    // Scale particle count with area, but clamp so small screens stay light
    count = Math.round(Math.min(PARTICLE_TARGET, (width * height) / 12000));
    particles = Array.from({ length: count }, makeParticle);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  };

  // Vector field angle at (x, y) evolving with time — cheap, organic flow
  const fieldAngle = (x, y, t) => {
    const s = 0.0016;
    return (
      Math.sin(x * s + t) +
      Math.cos(y * s - t * 0.8) +
      Math.sin((x + y) * s * 0.5 + t * 0.6)
    ) * 1.1;
  };

  const step = () => {
    // Fade the previous frame toward the background to create soft trails
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = bg;
    ctx.globalAlpha = 0.09;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;

    for (const p of particles) {
      const angle = fieldAngle(p.x, p.y, time);
      p.vx += Math.cos(angle) * 0.09;
      p.vy += Math.sin(angle) * 0.09;

      // Cursor repulsion for interactivity
      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 18000 && distSq > 0.01) {
          const force = (18000 - distSq) / 18000;
          const inv = 1 / Math.sqrt(distSq);
          p.vx += dx * inv * force * 1.6;
          p.vy += dy * inv * force * 1.6;
        }
      }

      p.vx *= 0.92; // damping
      p.vy *= 0.92;

      const nx = p.x + p.vx;
      const ny = p.y + p.vy;

      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.globalAlpha = 1;

      p.x = nx;
      p.y = ny;
      p.life -= 0.004;

      // Respawn when a particle dies or drifts off-canvas
      if (
        p.life <= 0 ||
        p.x < -20 || p.x > width + 20 ||
        p.y < -20 || p.y > height + 20
      ) {
        Object.assign(p, makeParticle());
      }
    }
  };

  const loop = () => {
    if (!running) return;
    time += 0.0016;
    step();
    rafId = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || prefersReduced) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  };

  // Draw a single calm frame for reduced-motion users
  const drawStaticFrame = () => {
    ctx.fillStyle = bg;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 3; i++) {
      const p = makeParticle();
      for (let k = 0; k < 60; k++) {
        const a = fieldAngle(p.x, p.y, i);
        const nx = p.x + Math.cos(a) * 4;
        const ny = p.y + Math.sin(a) * 4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        p.x = nx; p.y = ny;
        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) break;
      }
    }
    ctx.globalAlpha = 1;
  };

  // --- Wiring -------------------------------------------------
  readColors();
  resize();

  window.addEventListener("resize", () => {
    resize();
    if (prefersReduced) drawStaticFrame();
  });

  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = pointer.y >= 0 && pointer.y <= height;
  });
  window.addEventListener("mouseout", () => (pointer.active = false));

  // Re-read colors when the theme flips (works with the View Transition swap)
  new MutationObserver(readColors).observe(root, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  if (prefersReduced) {
    drawStaticFrame();
    return;
  }

  // Pause when the hero scrolls out of view to save the battery
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0 }
    );
    io.observe(canvas);
  } else {
    start();
  }
})();
