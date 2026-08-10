// ============================================================
//  Portfolio interactions — vanilla JS, no dependencies
// ============================================================
(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const supportsScrollTimeline =
    "CSS" in window && CSS.supports && CSS.supports("animation-timeline: view()");

  // ---------------------------------------------------------
  //  Theme toggle — persisted, with a View Transitions crossfade
  // ---------------------------------------------------------
  const THEME_KEY = "portfolio-theme";
  const toggle = document.querySelector("[data-theme-toggle]");
  const label = document.querySelector("[data-theme-label]");

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    if (label) label.textContent = theme === "dark" ? "Light" : "Dark";
  };

  // Initial theme is set pre-paint by the inline <head> script; just sync the label.
  applyTheme(root.getAttribute("data-theme") || "light");

  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      const commit = () => {
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
      };
      // Full-page color crossfade where supported (and motion is allowed)
      if (!reduceMotion && document.startViewTransition) {
        document.startViewTransition(commit);
      } else {
        commit();
      }
    });
  }

  // ---------------------------------------------------------
  //  Custom cursor (skipped on touch / reduced-motion)
  // ---------------------------------------------------------
  const ring = document.querySelector("[data-cursor]");
  const dot = document.querySelector("[data-cursor-dot]");

  if (ring && dot && finePointer && !reduceMotion) {
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    });

    const animate = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });
  }

  // ---------------------------------------------------------
  //  Scroll-reveal — JS fallback only where CSS scroll-driven
  //  animations are unsupported (e.g. Firefox as of 2026).
  // ---------------------------------------------------------
  const revealItems = document.querySelectorAll("[data-reveal]");

  if (reduceMotion || supportsScrollTimeline) {
    // CSS handles it (or motion is off) — make sure nothing is stuck hidden.
    if (!supportsScrollTimeline) revealItems.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry, i) => {
          if (!entry.isIntersecting) return;
          setTimeout(() => entry.target.classList.add("is-visible"), i * 70);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  // ---------------------------------------------------------
  //  Animated metric count-up (the AI/eval signature)
  // ---------------------------------------------------------
  const metrics = document.querySelectorAll("[data-count]");

  const formatValue = (el, value) => {
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    return prefix + value.toFixed(decimals) + suffix;
  };

  const runCount = (el) => {
    const from = parseFloat(el.dataset.from || "0");
    const to = parseFloat(el.dataset.to || "0");
    const duration = 1100;
    const start = performance.now();
    // easeOutCubic for a natural settle
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = formatValue(el, from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (metrics.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      metrics.forEach((el) => (el.textContent = formatValue(el, parseFloat(el.dataset.to || "0"))));
    } else {
      const metricObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runCount(entry.target);
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );
      metrics.forEach((el) => metricObserver.observe(el));
    }
  }

  // ---------------------------------------------------------
  //  Magnetic micro-interactions (pointer-fine, motion-on only)
  // ---------------------------------------------------------
  if (finePointer && !reduceMotion) {
    const magnets = document.querySelectorAll("[data-theme-toggle], .contact-email");
    magnets.forEach((el) => {
      el.classList.add("magnetic");
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  // ---------------------------------------------------------
  //  Dynamic year in footer
  // ---------------------------------------------------------
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
