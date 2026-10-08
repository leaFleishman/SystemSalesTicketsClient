// Small, dependency-free UI effects:
//  1. theme (dark / light) persisted in localStorage
//  2. pointer spotlight + 3D tilt on cards (CSS reads --mx --my --rx --ry)
//  3. one-time scroll reveal on the landing page
// Everything respects prefers-reduced-motion.

const THEME_KEY = "sst_theme";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- theme ---------------- */
export function getTheme() {
  return document.documentElement.getAttribute("data-theme") || "dark";
}

export function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage unavailable */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#f7f2e8" : "#0d0a1c");
}

export function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {
    /* ignore */
  }
  setTheme(saved === "light" ? "light" : "dark");
}

/* ---------------- pointer effects ---------------- */
const SPOT = ".ticket-card, .lp-feature, .lp-step, .dashboard-stat, .lp-ticket, .lp-final-card";
const TILT = ".ticket-card, .lp-ticket";

function onPointerMove(e) {
  const el = e.target.closest?.(SPOT);
  if (!el) return;

  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;

  el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
  el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);

  if (!reduceMotion && el.matches(TILT)) {
    el.style.setProperty("--ry", `${((x - 0.5) * 9).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - y) * 7).toFixed(2)}deg`);
  }
}

function onPointerOut(e) {
  const el = e.target.closest?.(TILT);
  if (!el || el.contains(e.relatedTarget)) return;
  el.style.setProperty("--rx", "0deg");
  el.style.setProperty("--ry", "0deg");
}

/* ---------------- scroll reveal (landing) ---------------- */
const REVEAL = ".lp-section-head, .lp-feature, .lp-step, .lp-final-card";

function initReveal() {
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
  );

  const scan = (root = document) => {
    root.querySelectorAll?.(REVEAL).forEach((el) => {
      if (el.hasAttribute("data-reveal")) return;
      const siblings = [...el.parentElement.children].filter((c) => c.matches(REVEAL));
      el.style.setProperty("--rd", String(siblings.indexOf(el)));
      el.setAttribute("data-reveal", "");
      io.observe(el);
    });
  };

  scan();
  // pages mount after route changes, so keep watching for new landing nodes
  new MutationObserver(() => scan()).observe(document.getElementById("root"), {
    childList: true,
    subtree: true,
  });
}

export function initEffects() {
  initTheme();
  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerout", onPointerOut, { passive: true });
  initReveal();
}
