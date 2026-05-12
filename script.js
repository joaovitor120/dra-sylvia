const header = document.querySelector("[data-header]");
const revealElements = document.querySelectorAll(".reveal");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const themeColor = document.querySelector('meta[name="theme-color"]');
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  themeToggle?.setAttribute("aria-pressed", String(theme === "dark"));
  if (themeLabel) {
    themeLabel.textContent = theme === "dark" ? "Modo claro" : "Modo escuro";
  }
  if (themeColor) {
    themeColor.setAttribute("content", theme === "dark" ? "#06131F" : "#0EA5A4");
  }
  if (persist) {
    localStorage.setItem("clinic-theme", theme);
  }
}

const savedTheme = localStorage.getItem("clinic-theme");
applyTheme(savedTheme || (systemTheme.matches ? "dark" : "light"), Boolean(savedTheme));

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, true);
  drawHeroScene();
});

systemTheme.addEventListener("change", (event) => {
  if (!localStorage.getItem("clinic-theme")) {
    applyTheme(event.matches ? "dark" : "light", false);
    drawHeroScene();
  }
});

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealElements.forEach((element) => revealObserver.observe(element));

const canvas = document.getElementById("heroCanvas");
const context = canvas?.getContext("2d");
let particles = [];
let animationFrame = 0;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resizeCanvas() {
  if (!canvas || !context) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.max(30, Math.min(74, Math.floor(rect.width / 18)));
  particles = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * rect.width,
    y: Math.random() * rect.height,
    radius: 18 + Math.random() * 68,
    speed: 0.16 + Math.random() * 0.42,
    phase: Math.random() * Math.PI * 2,
    hue: index % 3,
  }));
}

function drawToothShape(ctx, x, y, size, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, -1.1);
  ctx.bezierCurveTo(1.2, -2.1, 3.1, -1.2, 3.2, 0.7);
  ctx.bezierCurveTo(3.4, 2.9, 1.7, 6.1, 0.8, 6.6);
  ctx.bezierCurveTo(0.3, 6.9, 0.1, 6.5, 0, 6.1);
  ctx.bezierCurveTo(-0.1, 6.5, -0.3, 6.9, -0.8, 6.6);
  ctx.bezierCurveTo(-1.7, 6.1, -3.4, 2.9, -3.2, 0.7);
  ctx.bezierCurveTo(-3.1, -1.2, -1.2, -2.1, 0, -1.1);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
}

function drawHeroScene(timestamp = 0) {
  if (!canvas || !context) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const isDark = document.documentElement.dataset.theme === "dark";
  context.clearRect(0, 0, width, height);

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, isDark ? "#082333" : "#e0f7fa");
  gradient.addColorStop(0.45, isDark ? "#0b2a32" : "#dffcf8");
  gradient.addColorStop(1, isDark ? "#06131f" : "#ffffff");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  particles.forEach((particle, index) => {
    const drift = prefersReducedMotion ? 0 : Math.sin(timestamp * 0.0008 + particle.phase) * 18;
    particle.x += prefersReducedMotion ? 0 : particle.speed;
    if (particle.x - particle.radius > width + 80) {
      particle.x = -particle.radius - 20;
      particle.y = Math.random() * height;
    }

    const color = particle.hue === 0 ? "14, 165, 164" : particle.hue === 1 ? "56, 189, 248" : "34, 197, 94";
    context.beginPath();
    context.arc(particle.x, particle.y + drift, particle.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(${color}, ${isDark ? 0.14 : index % 4 === 0 ? 0.12 : 0.07})`;
    context.fill();
  });

  context.save();
  context.globalAlpha = 0.18;
  context.strokeStyle = isDark ? "#2dd4bf" : "#0ea5a4";
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(width * 0.48, height * 0.76);
  context.bezierCurveTo(width * 0.64, height * 0.92, width * 0.88, height * 0.82, width * 1.02, height * 0.58);
  context.stroke();
  context.restore();

  drawToothShape(context, width * 0.78, height * 0.36, Math.min(width, height) * 0.022, isDark ? 0.22 : 0.32);
  drawToothShape(context, width * 0.9, height * 0.64, Math.min(width, height) * 0.014, isDark ? 0.16 : 0.2);

  if (!prefersReducedMotion) {
    animationFrame = window.requestAnimationFrame(drawHeroScene);
  }
}

if (canvas && context) {
  resizeCanvas();
  drawHeroScene();
  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(animationFrame);
    resizeCanvas();
    drawHeroScene();
  });
}
