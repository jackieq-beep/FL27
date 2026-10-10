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
    // Only the hero and the game description section animate; the rest of the site stays still.
    const singles = document.querySelectorAll(".engine .split-head, .engine .feature-shot");
    const groups = document.querySelectorAll(".engine .points, .hero-stats");
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
    const heroMedia = document.querySelector(".hero-media");
    const drifters = [...document.querySelectorAll(".engine .feature-shot img")];
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

// Cookie consent banner + Google Consent Mode
(function () {
  const banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;
  const prefs = banner.querySelector("[data-cookie-prefs]");
  const btn = (k) => banner.querySelector(`[data-cookie="${k}"]`);
  const read = () => { try { return JSON.parse(localStorage.getItem("fl_consent") || "null"); } catch (e) { return null; } };
  const store = (c) => {
    c.date = new Date().toISOString();
    try { localStorage.setItem("fl_consent", JSON.stringify(c)); } catch (e) {}
    const m = c.marketing ? "granted" : "denied";
    if (window.gtag) gtag("consent", "update", { analytics_storage: c.analytics ? "granted" : "denied", ad_storage: m, ad_user_data: m, ad_personalization: m });
    if (!c.analytics) document.cookie.split(";").forEach((ck) => {
      const n = ck.split("=")[0].trim();
      if (/^_ga/.test(n)) [location.hostname, "." + location.hostname.split(".").slice(-2).join(".")].forEach((d) => { document.cookie = `${n}=; Max-Age=0; path=/; domain=${d}`; });
    });
    hide();
  };
  const showPrefs = (on) => { prefs.hidden = !on; btn("save").hidden = !on; btn("settings").hidden = on; };
  const show = (withPrefs) => {
    const c = read() || {};
    prefs.analytics.checked = !!c.analytics; prefs.marketing.checked = !!c.marketing;
    showPrefs(!!withPrefs); banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add("is-in"));
  };
  const hide = () => { banner.classList.remove("is-in"); setTimeout(() => { banner.hidden = true; }, 300); };

  btn("accept").addEventListener("click", () => store({ analytics: true, marketing: true }));
  btn("reject").addEventListener("click", () => store({ analytics: false, marketing: false }));
  btn("settings").addEventListener("click", () => showPrefs(true));
  btn("save").addEventListener("click", () => store({ analytics: prefs.analytics.checked, marketing: prefs.marketing.checked }));
  document.querySelectorAll("[data-cookie-settings]").forEach((el) => el.addEventListener("click", () => show(true)));

  const c = read();
  const expired = c && c.date && (Date.now() - new Date(c.date).getTime()) > 365 * 864e5;
  if (!c || expired) setTimeout(() => show(false), 600);
})();
