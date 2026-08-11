// ============================================================
//  Portfolio interactions — vanilla JS, no dependencies
// ============================================================
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const supportsScrollTimeline =
    "CSS" in window && CSS.supports && CSS.supports("animation-timeline: view()");
  const supportsScrollProgress =
    "CSS" in window && CSS.supports && CSS.supports("animation-timeline: scroll()");

  // ---------------------------------------------------------
  //  Smooth "glide" scrolling with Lenis (loaded from CDN).
  //  The single biggest perceived-quality upgrade. Off when
  //  the user prefers reduced motion.
  // ---------------------------------------------------------
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis === "function") {
    lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Keep in-page anchor links working through Lenis.
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -20 });
      });
    });
  }

  // ---------------------------------------------------------
  //  Header condenses once the page is scrolled
  // ---------------------------------------------------------
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");

  if (header || (progress && !supportsScrollProgress)) {
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (header) header.classList.toggle("is-scrolled", y > 24);
      if (progress && !supportsScrollProgress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.setProperty("--scroll", max > 0 ? (y / max).toFixed(4) : "0");
      }
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(onScroll);
        }
      },
      { passive: true }
    );
    onScroll();
  }

  // ---------------------------------------------------------
  //  Scroll-reveal — JS fallback only where CSS scroll-driven
  //  animations are unsupported (e.g. Firefox as of 2026).
  // ---------------------------------------------------------
  const revealItems = document.querySelectorAll("[data-reveal]");

  if (reduceMotion || supportsScrollTimeline) {
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
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic

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
  //  Magnetic micro-interactions on pill buttons
  // ---------------------------------------------------------
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".btn").forEach((el) => {
      el.classList.add("magnetic");
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.28}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  // ---------------------------------------------------------
  //  Background video: play only while in view (saves bandwidth
  //  on the large file), and stay paused for reduced-motion.
  // ---------------------------------------------------------
  const bgVideos = document.querySelectorAll("[data-bg-video]");
  if (bgVideos.length) {
    if (reduceMotion) {
      bgVideos.forEach((v) => {
        v.removeAttribute("autoplay");
        v.pause();
      });
    } else if ("IntersectionObserver" in window) {
      const videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.play().catch(() => {});
            } else {
              entry.target.pause();
            }
          });
        },
        { threshold: 0.2 }
      );
      bgVideos.forEach((v) => videoObserver.observe(v));
    } else {
      bgVideos.forEach((v) => v.play().catch(() => {}));
    }
  }

  // ---------------------------------------------------------
  //  Page transitions — fade out before same-origin navigations
  //  (in-page # links are handled by Lenis above and skipped here)
  // ---------------------------------------------------------
  if (!reduceMotion) {
    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || link.target === "_blank" || link.hasAttribute("download")) return;

      let url;
      try {
        url = new URL(link.href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return; // external link
      if (url.pathname === location.pathname && url.hash) return; // same page, just a hash

      e.preventDefault();
      document.body.classList.add("is-leaving");
      window.setTimeout(() => {
        window.location.href = link.href;
      }, 240);
    });

    // Reset when returning via back/forward (bfcache restore)
    window.addEventListener("pageshow", () => {
      document.body.classList.remove("is-leaving");
    });
  }

  // ---------------------------------------------------------
  //  Dynamic year in footer
  // ---------------------------------------------------------
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
