const EVENT_CONFIG = {
  title: "Lễ Tốt Nghiệp — Nguyễn Quang Vượng (ĐH Kiến trúc Hà Nội)",
  startISO: "2026-11-29T08:30:00+07:00",
  endISO: "2026-11-29T11:30:00+07:00",
  location: "Sân bóng rổ Trường Đại học Kiến trúc Hà Nội, Km 10 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  description: "Trân trọng kính mời gia đình và bạn bè đến tham dự Lễ Tốt Nghiệp của Nguyễn Quang Vượng — Khoa Kiến trúc, Trường Đại học Kiến trúc Hà Nội."
};

const SVG_NS = "http://www.w3.org/2000/svg";

const scrollState = {
  y: 0,
  progress: 0
};

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initGuestGreeting() {
  const guestEl = document.getElementById("guestName");
  if (!guestEl) return;

  const params = new URLSearchParams(window.location.search);
  const rawName = params.get("guest") || params.get("to") || params.get("ten") || "";
  const cleaned = rawName.trim().slice(0, 64);
  guestEl.textContent = cleaned || "Gia đình & Bạn bè thân mến";
}

function padTwo(value) {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}

function initCountdown() {
  const daysEl = document.getElementById("cdDays");
  const hoursEl = document.getElementById("cdHours");
  const minutesEl = document.getElementById("cdMinutes");
  const secondsEl = document.getElementById("cdSeconds");
  const statusEl = document.getElementById("countdownStatus");
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl || !statusEl) return;

  const startMs = new Date(EVENT_CONFIG.startISO).getTime();
  const endMs = new Date(EVENT_CONFIG.endISO).getTime();

  function renderCountdown() {
    const nowMs = Date.now();
    const diff = startMs - nowMs;

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      statusEl.textContent = nowMs <= endMs
        ? "Buổi lễ đang diễn ra — Hẹn gặp bạn tại sân trường!"
        : "Buổi lễ đã khép lại trọn vẹn — Cảm ơn bạn đã chung vui!";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysEl.textContent = padTwo(days);
    hoursEl.textContent = padTwo(hours);
    minutesEl.textContent = padTwo(minutes);
    secondsEl.textContent = padTwo(seconds);
    statusEl.textContent = days === 0
      ? "Chỉ còn vài giờ nữa — Hẹn gặp tại Sân bóng rổ ĐH Kiến trúc HN!"
      : "Đếm ngược tới khoảnh khắc tốt nghiệp!";
  }

  renderCountdown();
  window.setInterval(renderCountdown, 1000);
}

function initCopyAddress() {
  const copyBtn = document.getElementById("copyAddressBtn");
  const addressEl = document.getElementById("venueAddress");
  const feedbackEl = document.getElementById("copyFeedback");
  if (!copyBtn || !addressEl || !feedbackEl) return;

  let clearTimer = 0;

  function showFeedback(text) {
    feedbackEl.textContent = text;
    window.clearTimeout(clearTimer);
    clearTimer = window.setTimeout(() => {
      feedbackEl.textContent = "";
    }, 2800);
  }

  copyBtn.addEventListener("click", async () => {
    const addressText = (addressEl.textContent || EVENT_CONFIG.location).trim();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(addressText);
        showFeedback("Đã sao chép địa chỉ vào bộ nhớ tạm.");
        return;
      }
    } catch (_err) {
      // Fallback below if Clipboard API is restricted.
    }

    const tempInput = document.createElement("textarea");
    tempInput.value = addressText;
    tempInput.setAttribute("readonly", "");
    tempInput.style.position = "fixed";
    tempInput.style.opacity = "0";
    document.body.appendChild(tempInput);
    tempInput.select();

    try {
      const ok = document.execCommand("copy");
      showFeedback(ok ? "Đã sao chép địa chỉ vào bộ nhớ tạm." : "Không thể tự sao chép, vui lòng copy thủ công.");
    } catch (_err) {
      showFeedback("Không thể tự sao chép, vui lòng copy thủ công.");
    } finally {
      document.body.removeChild(tempInput);
    }
  });
}

function formatIcsUtc(isoString) {
  const date = new Date(isoString);
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function initCalendarDownload() {
  const addBtn = document.getElementById("addToCalendarBtn");
  if (!addBtn) return;

  addBtn.addEventListener("click", () => {
    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nguyen Quang Vuong//Graduation Invitation//VI",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:gradue-20261129-nqv@hau.edu.vn",
      `DTSTAMP:${formatIcsUtc(new Date().toISOString())}`,
      `DTSTART:${formatIcsUtc(EVENT_CONFIG.startISO)}`,
      `DTEND:${formatIcsUtc(EVENT_CONFIG.endISO)}`,
      `SUMMARY:${escapeIcsText(EVENT_CONFIG.title)}`,
      `LOCATION:${escapeIcsText(EVENT_CONFIG.location)}`,
      `DESCRIPTION:${escapeIcsText(EVENT_CONFIG.description)}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsLines], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "le-tot-nghiep.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

function createSvgElement(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, String(val));
  }
  return el;
}

function buildCapSvg() {
  const svg = createSvgElement("svg", { viewBox: "0 0 64 48", "aria-hidden": "true" });

  // Bright university cobalt mortarboard
  svg.appendChild(createSvgElement("polygon", {
    points: "32,5 60,18 32,30 4,18",
    fill: "#1d5fd6",
    stroke: "#fbbf24",
    "stroke-width": "1.6",
    "stroke-linejoin": "round"
  }));
  svg.appendChild(createSvgElement("polygon", {
    points: "32,8 54,18 32,27 10,18",
    fill: "#3b82f6",
    opacity: "0.75"
  }));

  // Skullcap crown base
  svg.appendChild(createSvgElement("path", {
    d: "M17,24 L17,33 C17,38 47,38 47,33 L47,24 L32,30 Z",
    fill: "#14429e",
    stroke: "#f59e0b",
    "stroke-width": "1.2",
    "stroke-linejoin": "round"
  }));

  // Sunny gold tassel
  svg.appendChild(createSvgElement("circle", { cx: "32", cy: "17.5", r: "2.4", fill: "#fde047" }));
  svg.appendChild(createSvgElement("path", {
    d: "M32,17.5 Q45,20 49,33",
    fill: "none",
    stroke: "#f59e0b",
    "stroke-width": "2.1",
    "stroke-linecap": "round"
  }));
  svg.appendChild(createSvgElement("path", {
    d: "M49,33 L46,42.5 L52,42.5 Z",
    fill: "#fbbf24"
  }));

  return svg;
}

function buildDiplomaSvg() {
  const svg = createSvgElement("svg", { viewBox: "0 0 64 36", "aria-hidden": "true" });

  // Bright warm cream scroll with crisp golden edge
  svg.appendChild(createSvgElement("rect", {
    x: "7",
    y: "11",
    width: "48",
    height: "14",
    rx: "6",
    fill: "#fffdf2",
    stroke: "#d97706",
    "stroke-width": "1.4"
  }));
  svg.appendChild(createSvgElement("ellipse", {
    cx: "12.5",
    cy: "18",
    rx: "4",
    ry: "7",
    fill: "#fde68a",
    stroke: "#d97706",
    "stroke-width": "1.1"
  }));
  svg.appendChild(createSvgElement("ellipse", {
    cx: "12.5",
    cy: "18",
    rx: "1.9",
    ry: "3.4",
    fill: "#92400e"
  }));

  // Joyful coral-crimson satin ribbon
  svg.appendChild(createSvgElement("rect", {
    x: "28",
    y: "10.2",
    width: "8",
    height: "15.6",
    rx: "2",
    fill: "#e11d48",
    stroke: "#fef08a",
    "stroke-width": "0.9"
  }));
  svg.appendChild(createSvgElement("path", {
    d: "M30,25 L26,33 L31.5,29.5 L35.5,33.5 L34,25 Z",
    fill: "#f43f5e"
  }));
  svg.appendChild(createSvgElement("circle", {
    cx: "32",
    cy: "18",
    r: "2.3",
    fill: "#fef08a"
  }));

  return svg;
}

function buildSparkleSvg() {
  const svg = createSvgElement("svg", { viewBox: "0 0 32 32", "aria-hidden": "true" });
  svg.appendChild(createSvgElement("path", {
    d: "M16,2 C17.3,11 21,14.7 30,16 C21,17.3 17.3,21 16,30 C14.7,21 11,17.3 2,16 C11,14.7 14.7,11 16,2 Z",
    fill: "#f59e0b",
    stroke: "#fffbeb",
    "stroke-width": "0.9"
  }));
  return svg;
}

function buildRibbonSvg(color) {
  const svg = createSvgElement("svg", { viewBox: "0 0 18 26", "aria-hidden": "true" });
  svg.appendChild(createSvgElement("rect", {
    x: "4",
    y: "2",
    width: "10",
    height: "20",
    rx: "2.5",
    fill: color
  }));
  return svg;
}

function initFloatingDecor() {
  const backLayer = document.getElementById("floatingBack");
  const frontLayer = document.getElementById("floatingFront");
  if (!backLayer || !frontLayer) return;

  backLayer.innerHTML = "";
  frontLayer.innerHTML = "";

  const isCompact = window.innerWidth < 640;

  const pieces = [
    // Back layer: bright graduation caps & diplomas around the margin
    { layer: "back", kind: "cap", x: 5, y: 10, size: 54, depth: "depth-mid", dur: 11, delay: -1.4, dx: 20, dy: -26, rotA: -14, rotB: 8 },
    { layer: "back", kind: "diploma", x: 14, y: 26, size: 56, depth: "depth-far", dur: 14, delay: -4.2, dx: 18, dy: -20, rotA: -22, rotB: -8 },
    { layer: "back", kind: "cap", x: 7, y: 48, size: 62, depth: "depth-mid", dur: 13, delay: -7.1, dx: 24, dy: -32, rotA: 8, rotB: -12 },
    { layer: "back", kind: "diploma", x: 12, y: 74, size: 52, depth: "depth-mid", dur: 12, delay: -2.8, dx: 16, dy: -24, rotA: 14, rotB: -6 },
    { layer: "back", kind: "cap", x: 6, y: 88, size: 46, depth: "depth-far", dur: 15, delay: -9.5, dx: 22, dy: -18, rotA: -18, rotB: 6 },

    { layer: "back", kind: "cap", x: 88, y: 12, size: 58, depth: "depth-mid", dur: 12.5, delay: -3.1, dx: -22, dy: -24, rotA: 12, rotB: -10 },
    { layer: "back", kind: "diploma", x: 82, y: 31, size: 54, depth: "depth-far", dur: 14.5, delay: -6.4, dx: -18, dy: -28, rotA: 24, rotB: 8 },
    { layer: "back", kind: "cap", x: 90, y: 54, size: 64, depth: "depth-mid", dur: 11.8, delay: -5.2, dx: -24, dy: -22, rotA: -12, rotB: 14 },
    { layer: "back", kind: "diploma", x: 84, y: 76, size: 56, depth: "depth-mid", dur: 13.6, delay: -8.3, dx: -16, dy: -30, rotA: -16, rotB: 10 },
    { layer: "back", kind: "cap", x: 91, y: 90, size: 48, depth: "depth-far", dur: 15.2, delay: -1.9, dx: -20, dy: -20, rotA: 16, rotB: -8 },

    // Back layer sunny bokeh orbs & golden stars
    { layer: "back", kind: "orb", x: 9, y: 20, size: 15, depth: "depth-mid", dur: 9, delay: -2.1, dx: 14, dy: -22 },
    { layer: "back", kind: "orb", x: 20, y: 62, size: 11, depth: "depth-far", dur: 11, delay: -5.4, dx: 10, dy: -18 },
    { layer: "back", kind: "orb", x: 80, y: 21, size: 13, depth: "depth-mid", dur: 10, delay: -3.7, dx: -12, dy: -20 },
    { layer: "back", kind: "orb", x: 86, y: 65, size: 16, depth: "depth-mid", dur: 12, delay: -7.5, dx: -16, dy: -24 },
    { layer: "back", kind: "sparkle", x: 18, y: 12, size: 22, depth: "depth-mid", dur: 4.2, delay: -0.8 },
    { layer: "back", kind: "sparkle", x: 84, y: 42, size: 20, depth: "depth-mid", dur: 4.8, delay: -2.3 },
    { layer: "back", kind: "sparkle", x: 15, y: 84, size: 24, depth: "depth-mid", dur: 5.1, delay: -3.5 },
    { layer: "back", kind: "sparkle", x: 78, y: 86, size: 18, depth: "depth-mid", dur: 4.4, delay: -1.6 },

    // Front layer: foreground caps & diplomas drifting along periphery/edges
    { layer: "front", kind: "cap", x: 19, y: 34, size: 44, depth: "depth-near", dur: 10.5, delay: -2.4, dx: 14, dy: -18, rotA: -10, rotB: 10 },
    { layer: "front", kind: "cap", x: 75, y: 49, size: 46, depth: "depth-near", dur: 11.4, delay: -6.1, dx: -16, dy: -22, rotA: 12, rotB: -8 },
    { layer: "front", kind: "diploma", x: 24, y: 78, size: 44, depth: "depth-near", dur: 12.8, delay: -3.8, dx: 14, dy: -20, rotA: -14, rotB: 6 },
    { layer: "front", kind: "cap", x: 73, y: 17, size: 36, depth: "depth-near", dur: 10.2, delay: -4.9, dx: -12, dy: -16, rotA: 10, rotB: -12 },
    { layer: "front", kind: "sparkle", x: 28, y: 24, size: 18, depth: "depth-near", dur: 3.9, delay: -1.1 },
    { layer: "front", kind: "sparkle", x: 71, y: 69, size: 20, depth: "depth-near", dur: 4.3, delay: -2.8 },
    { layer: "front", kind: "orb", x: 67, y: 39, size: 10, depth: "depth-near", dur: 9.6, delay: -4.0, dx: -10, dy: -16 },

    // Joyful falling ribbons on front & back
    { layer: "back", kind: "ribbon", color: "#2563eb", x: 11, y: -5, size: 13, depth: "depth-mid", dur: 13, delay: -2, sway: 28, spin: 320 },
    { layer: "back", kind: "ribbon", color: "#0ea5e9", x: 26, y: -5, size: 11, depth: "depth-far", dur: 16, delay: -7, sway: -24, spin: -290 },
    { layer: "back", kind: "ribbon", color: "#f59e0b", x: 74, y: -5, size: 12, depth: "depth-mid", dur: 14, delay: -4, sway: -30, spin: 340 },
    { layer: "back", kind: "ribbon", color: "#10b981", x: 89, y: -5, size: 11, depth: "depth-far", dur: 15, delay: -10, sway: 26, spin: -360 },
    { layer: "front", kind: "ribbon", color: "#fbbf24", x: 34, y: -5, size: 10, depth: "depth-near", dur: 12, delay: -5.5, sway: 22, spin: 280 },
    { layer: "front", kind: "ribbon", color: "#f43f5e", x: 64, y: -5, size: 10, depth: "depth-near", dur: 13.5, delay: -9.2, sway: -22, spin: -310 }
  ];

  const desktopExtras = [
    { layer: "back", kind: "cap", x: 23, y: 18, size: 42, depth: "depth-far", dur: 13.2, delay: -5.6, dx: 14, dy: -22, rotA: -14, rotB: 6 },
    { layer: "back", kind: "diploma", x: 78, y: 63, size: 48, depth: "depth-far", dur: 14.1, delay: -2.2, dx: -16, dy: -18, rotA: 18, rotB: -8 },
    { layer: "front", kind: "diploma", x: 80, y: 84, size: 42, depth: "depth-near", dur: 12.2, delay: -7.4, dx: -14, dy: -18, rotA: -10, rotB: 12 },
    { layer: "back", kind: "ribbon", color: "#f43f5e", x: 18, y: -5, size: 10, depth: "depth-mid", dur: 14.5, delay: -11, sway: 32, spin: 300 },
    { layer: "back", kind: "ribbon", color: "#2563eb", x: 82, y: -5, size: 12, depth: "depth-mid", dur: 12.8, delay: -3.3, sway: -28, spin: -340 }
  ];

  const activeList = isCompact ? pieces : pieces.concat(desktopExtras);

  for (const item of activeList) {
    const wrapper = document.createElement("div");
    wrapper.className = `floating-piece floating-${item.kind} ${item.depth}`;
    wrapper.style.left = `${item.x}%`;
    wrapper.style.top = `${item.y}%`;

    const scaledSize = isCompact ? Math.round(item.size * 0.78) : item.size;
    wrapper.style.width = `${scaledSize}px`;
    wrapper.style.height = `${scaledSize}px`;

    wrapper.style.setProperty("--dur", `${item.dur}s`);
    wrapper.style.setProperty("--delay", `${item.delay}s`);
    if (item.dx !== undefined) wrapper.style.setProperty("--dx", `${item.dx}px`);
    if (item.dy !== undefined) wrapper.style.setProperty("--dy", `${item.dy}px`);
    if (item.rotA !== undefined) wrapper.style.setProperty("--rot-a", `${item.rotA}deg`);
    if (item.rotB !== undefined) wrapper.style.setProperty("--rot-b", `${item.rotB}deg`);
    if (item.sway !== undefined) wrapper.style.setProperty("--sway", `${item.sway}px`);
    if (item.spin !== undefined) wrapper.style.setProperty("--spin", `${item.spin}deg`);

    if (item.kind === "cap") {
      wrapper.appendChild(buildCapSvg());
    } else if (item.kind === "diploma") {
      wrapper.appendChild(buildDiplomaSvg());
    } else if (item.kind === "sparkle") {
      wrapper.appendChild(buildSparkleSvg());
    } else if (item.kind === "ribbon") {
      wrapper.appendChild(buildRibbonSvg(item.color || "#fbbf24"));
    }

    (item.layer === "front" ? frontLayer : backLayer).appendChild(wrapper);
  }
}

/* Architectural Scroll Motion: Blueprint scale bar, protractor rotation, parallax & section reveal */
function initArchScroll() {
  const revealNodes = Array.from(document.querySelectorAll("[data-arch-reveal]"));
  const rootStyle = document.documentElement.style;

  if (prefersReducedMotion()) {
    revealNodes.forEach((node) => node.classList.add("is-revealed"));
    rootStyle.setProperty("--scroll-p", "0");
    return;
  }

  document.documentElement.classList.add("arch-ready");

  function revealVisibleNow() {
    const viewH = window.innerHeight || 800;
    for (const node of revealNodes) {
      if (node.classList.contains("is-revealed")) continue;
      const rect = node.getBoundingClientRect();
      if (rect.top <= viewH * 0.94) {
        node.classList.add("is-revealed");
      }
    }
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -28px 0px" }
    );

    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-revealed"));
  }

  let ticking = false;
  function updateScrollProps() {
    ticking = false;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, scrollY / maxScroll));

    scrollState.y = scrollY;
    scrollState.progress = progress;

    rootStyle.setProperty("--scroll-p", progress.toFixed(4));
    rootStyle.setProperty("--scroll-grid-y", `${(-scrollY * 0.24).toFixed(1)}px`);
    rootStyle.setProperty("--scroll-back-y", `${(-progress * 26).toFixed(1)}px`);
    rootStyle.setProperty("--scroll-front-y", `${(-progress * 72).toFixed(1)}px`);

    if (progress > 0.96) {
      revealNodes.forEach((node) => node.classList.add("is-revealed"));
    } else {
      revealVisibleNow();
    }
  }

  function onScrollOrResize() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScrollProps);
    }
  }

  revealVisibleNow();
  updateScrollProps();
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
}

function drawArchitecturalBackdrop(ctx, width, height) {
  const p = scrollState.progress;

  // Isometric wireframe drafting cube (top-left architectural accent, parallax on scroll)
  const cx1 = width < 640 ? width * 0.14 : width * 0.11;
  const cy1 = height * 0.24 - p * 95;
  const size = width < 640 ? 28 : 44;
  const angle = p * 1.15 + 0.35;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  ctx.save();
  ctx.translate(cx1, cy1);
  ctx.strokeStyle = "rgba(27, 109, 226, 0.16)";
  ctx.lineWidth = 1.25;

  const verts = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
  ].map(([vx, vy, vz]) => {
    const rx = vx * cosA - vz * sinA;
    const rz = vx * sinA + vz * cosA;
    const isoX = (rx - rz * 0.55) * size * 0.72;
    const isoY = (vy * 0.78 + (rx + rz) * 0.32) * size * 0.72;
    return [isoX, isoY];
  });

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];

  ctx.beginPath();
  for (const [a, b] of edges) {
    ctx.moveTo(verts[a][0], verts[a][1]);
    ctx.lineTo(verts[b][0], verts[b][1]);
  }
  ctx.stroke();
  ctx.restore();

  // Architectural drafting compass arcs (lower right, rotating smoothly with scroll)
  const cx2 = width < 640 ? width * 0.88 : width * 0.89;
  const cy2 = height * 0.68 - p * 110;
  const rOuter = width < 640 ? 48 : 74;

  ctx.save();
  ctx.translate(cx2, cy2);
  ctx.rotate(-p * Math.PI * 0.9);
  ctx.strokeStyle = "rgba(217, 119, 6, 0.17)";
  ctx.lineWidth = 1.3;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, rOuter, 0, Math.PI * 1.45);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(27, 109, 226, 0.14)";
  ctx.beginPath();
  ctx.arc(0, 0, rOuter * 0.68, Math.PI * 0.35, Math.PI * 1.85);
  ctx.stroke();

  // Precision crosshair
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(12, 0);
  ctx.moveTo(0, -12);
  ctx.lineTo(0, 12);
  ctx.stroke();
  ctx.restore();
}

function initBgCanvas() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  const particles = [];

  const palette = [
    "#2563eb",
    "#0ea5e9",
    "#f59e0b",
    "#fbbf24",
    "#f43f5e",
    "#10b981"
  ];

  function createParticle(randomY) {
    const roll = Math.random();
    const kind = roll < 0.6 ? "confetti" : roll < 0.84 ? "bokeh" : "star";
    return {
      kind,
      x: Math.random() * width,
      y: randomY ? Math.random() * height : kind === "confetti" ? -20 : height + 20,
      vx: (Math.random() - 0.5) * (kind === "confetti" ? 18 : 8),
      vy: kind === "confetti" ? 22 + Math.random() * 28 : -(8 + Math.random() * 14),
      size: kind === "confetti" ? 4.5 + Math.random() * 6 : kind === "bokeh" ? 4 + Math.random() * 10 : 4 + Math.random() * 6,
      aspect: 0.45 + Math.random() * 0.45,
      color: palette[Math.floor(Math.random() * palette.length)],
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 2.4,
      tilt: Math.random() * Math.PI * 2,
      tiltSpeed: 1.5 + Math.random() * 2.8,
      phase: Math.random() * Math.PI * 2,
      alpha: kind === "bokeh" ? 0.24 + Math.random() * 0.3 : 0.65 + Math.random() * 0.3
    };
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targetCount = width < 640 ? 48 : 88;
    while (particles.length < targetCount) particles.push(createParticle(true));
    if (particles.length > targetCount) particles.length = targetCount;
  }

  function drawFrame(dt, elapsedSec) {
    ctx.clearRect(0, 0, width, height);
    drawArchitecturalBackdrop(ctx, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += (p.vx + Math.sin(elapsedSec * 0.9 + p.phase) * 9) * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      p.tilt += p.tiltSpeed * dt;

      if (p.kind === "confetti" && p.y > height + 24) {
        particles[i] = createParticle(false);
        continue;
      }
      if (p.kind !== "confetti" && p.y < -24) {
        particles[i] = createParticle(false);
        continue;
      }
      if (p.x < -30) p.x = width + 24;
      if (p.x > width + 30) p.x = -24;

      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.kind === "bokeh") {
        const pulse = 0.72 + 0.28 * Math.sin(elapsedSec * 1.4 + p.phase);
        ctx.globalAlpha = p.alpha * pulse;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        grad.addColorStop(0.5, "rgba(251, 191, 36, 0.45)");
        grad.addColorStop(1, "rgba(251, 191, 36, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "star") {
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(elapsedSec * 1.8 + p.phase));
        ctx.globalAlpha = p.alpha * twinkle;
        ctx.rotate(p.angle * 0.25);
        ctx.fillStyle = "#f59e0b";
        const r = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.quadraticCurveTo(0, 0, 0, r);
        ctx.quadraticCurveTo(0, 0, -r, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r);
        ctx.fill();
      } else {
        ctx.globalAlpha = p.alpha;
        ctx.rotate(p.angle);
        ctx.scale(1, Math.max(0.18, Math.abs(Math.cos(p.tilt))));
        ctx.fillStyle = p.color;
        const w = p.size;
        const h = p.size * p.aspect;
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }

      ctx.restore();
    }
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });

  if (prefersReducedMotion()) {
    drawFrame(0, 1.2);
    return;
  }

  let lastTime = performance.now();
  function tick(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    drawFrame(dt, now / 1000);
    window.requestAnimationFrame(tick);
  }

  window.requestAnimationFrame(tick);
}

function initBurstCelebration() {
  const canvas = document.getElementById("burstCanvas");
  const celebrateBtn = document.getElementById("celebrateBtn");
  const medallionBtn = document.getElementById("portraitMedallion");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let running = false;
  let lastTime = 0;
  const burstParticles = [];

  const colors = [
    "#2563eb",
    "#0ea5e9",
    "#f59e0b",
    "#fbbf24",
    "#f43f5e",
    "#10b981",
    "#ffffff"
  ];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnBurst(originX, originY, count) {
    if (prefersReducedMotion()) return;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 170 + Math.random() * 390;
      const shape = Math.random() < 0.25 ? "circle" : "rect";
      burstParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 130,
        size: 5 + Math.random() * 6,
        shape,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 10,
        tilt: Math.random() * Math.PI * 2,
        life: 1.5 + Math.random() * 0.9,
        age: 0
      });
    }

    if (!running) {
      running = true;
      lastTime = performance.now();
      window.requestAnimationFrame(step);
    }
  }

  function step(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    ctx.clearRect(0, 0, width, height);

    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const p = burstParticles[i];
      p.age += dt;
      if (p.age >= p.life) {
        burstParticles.splice(i, 1);
        continue;
      }

      p.vx *= 1 - 1.5 * dt;
      p.vy = p.vy * (1 - 1.1 * dt) + 390 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.rotSpeed * dt;
      p.tilt += 6 * dt;

      const progress = p.age / p.life;
      const alpha = progress < 0.7 ? 1 : Math.max(0, (1 - progress) / 0.3);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.scale(1, Math.max(0.22, Math.abs(Math.cos(p.tilt))));
        ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
      }

      ctx.restore();
    }

    if (burstParticles.length > 0) {
      window.requestAnimationFrame(step);
    } else {
      running = false;
      ctx.clearRect(0, 0, width, height);
    }
  }

  function burstFromElement(el, count) {
    const rect = el.getBoundingClientRect();
    spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, count);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });

  if (medallionBtn) {
    medallionBtn.addEventListener("click", () => {
      burstFromElement(medallionBtn, 56);
    });
  }

  if (celebrateBtn) {
    celebrateBtn.addEventListener("click", () => {
      burstFromElement(celebrateBtn, 48);
      spawnBurst(width * 0.24, height * 0.62, 34);
      spawnBurst(width * 0.76, height * 0.62, 34);
    });
  }

  // Gentle welcome burst near medallion after initial card reveal
  if (medallionBtn && !prefersReducedMotion()) {
    window.setTimeout(() => {
      burstFromElement(medallionBtn, 38);
    }, 520);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initGuestGreeting();
  initCountdown();
  initCopyAddress();
  initCalendarDownload();
  initFloatingDecor();
  initArchScroll();
  initBgCanvas();
  initBurstCelebration();

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(initFloatingDecor, 220);
  }, { passive: true });
});
