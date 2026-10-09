// Football League 2026 – small site behaviours (no libraries needed)
(function () {
  document.documentElement.classList.add("js");

  // Header turns solid after scrolling
  const header = document.querySelector("[data-header]");
  const onScroll = () => header && header.classList.toggle("is-solid", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Language dropdown
  document.querySelectorAll("[data-dropdown]").forEach((dd) => {
    const btn = dd.querySelector("[data-dropdown-toggle]");
    const menu = dd.querySelector("[data-dropdown-menu]");
    const set = (open) => { btn.setAttribute("aria-expanded", String(open)); menu.hidden = !open; };
    btn.addEventListener("click", (e) => { e.stopPropagation(); set(menu.hidden); });
    document.addEventListener("click", (e) => { if (!dd.contains(e.target)) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { set(false); btn.focus(); } });
  });

  // Mobile menu
  const menu = document.querySelector("[data-menu]");
  const openBtn = document.querySelector("[data-menu-open]");
  if (menu && openBtn) {
    const open = () => {
      menu.hidden = false;
      openBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      const first = menu.querySelector("[data-menu-close]");
      first && first.focus();
    };
    const close = () => {
      menu.hidden = true;
      openBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      openBtn.focus();
    };
    openBtn.addEventListener("click", open);
    menu.querySelectorAll("[data-menu-close], [data-menu-link]").forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) close(); });
    window.matchMedia("(min-width: 1081px)").addEventListener("change", (e) => { if (e.matches && !menu.hidden) close(); });
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Hero entrance on load
  requestAnimationFrame(() => document.documentElement.classList.add("is-loaded"));

  // Content slides in as it scrolls into view; grids animate their items one after another
  if ("IntersectionObserver" in window && !reduce) {
    const singles = document.querySelectorAll(".split-head, .feature-shot, .clubs-copy, .clubs-media figure, .merch-card, .download-copy, .download-media, .cat-more");
    const groups = document.querySelectorAll(".points, .mode-grid, .news-grid, .community-grid, .cat-grid, .hero-stats");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    singles.forEach((el) => { el.classList.add("reveal"); io.observe(el); });
    groups.forEach((g) => {
      [...g.children].forEach((child, i) => { child.classList.add("reveal"); child.style.setProperty("--i", i); io.observe(child); });
    });
  }

  // Parallax depth: hero image and big pictures drift slower than the page
  if (!reduce) {
    const heroMedia = document.querySelector(".hero-media, .shop-hero-bg, .coming-bg");
    const drifters = [...document.querySelectorAll(".feature-shot img, .clubs-media img")];
    let ticking = false;
    const frame = () => {
      const y = window.scrollY, vh = window.innerHeight;
      if (heroMedia && y < vh * 1.2) heroMedia.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
      drifters.forEach((img) => {
        const r = img.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;   // -0.5 … 0.5 while on screen
        img.style.transform = `translate3d(0, ${p * -40}px, 0) scale(1.1)`;
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    frame();
  }
})();
