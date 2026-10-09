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

  // Gentle fade-in of sections as they scroll into view
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const items = document.querySelectorAll(".split-head, .feature-shot, .points, .mode-grid, .clubs-grid, .news-grid, .merch-card, .download-grid, .community-grid");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => { el.classList.add("reveal"); io.observe(el); });
  }
})();
