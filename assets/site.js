(() => {
  "use strict";

  const PHOTOS = typeof CATALOG !== "undefined" ? CATALOG : [];
  const BY_SLUG = Object.fromEntries(PHOTOS.map((p) => [p.slug, p]));
  const CONTACT = "https://github.com/yuvalkolodkingal";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Fourteen catalog subjects folded into six.
  const CATEGORIES = [
    { id: "birds", name: "Birds", from: ["birds", "geese", "ducks"], cover: "2026-11-13_birds_0331" },
    { id: "flowers", name: "Flowers & plants", from: ["flowers-plants", "nature-details"], cover: "violet-water" },
    { id: "parks", name: "Parks & water", from: ["landscape", "water-fountain"], cover: "2026-11-13_landscape_0513" },
    { id: "sky", name: "Sky & light", from: ["sunset", "night", "sky"], cover: "rose-city" },
    { id: "pets", name: "Cats & dogs", from: ["cats", "dog"], cover: "2026-11-12_cats_0202" },
    { id: "small", name: "Small things", from: ["insects", "sea-life"], cover: "butterfly-in-gold" },
  ];
  const CAT_OF = {};
  CATEGORIES.forEach((c) => c.from.forEach((f) => (CAT_OF[f] = c)));

  // The camera files only have frame numbers, so they get names here.
  const TITLES = {
    "2026-11-13_birds_0285": "Crow in the branches",
    "2026-11-13_birds_0298": "Myna, twice",
    "2026-11-13_birds_0302": "Myna, drinking",
    "2026-11-13_birds_0305": "Crow, half hidden",
    "2026-11-13_birds_0330": "Hoopoe behind the fence",
    "2026-11-13_birds_0331": "Hoopoe on the lawn",
    "2026-11-13_birds_0339": "Somewhere in this tree",
    "2026-11-13_birds_0455": "Hooded crow",
    "2026-11-13_birds_0460": "Crow on the grass",
    "2026-11-13_birds_0589": "Parakeets, mid-argument",
    "2026-11-12_dog_0213": "White dog, very pleased",
    "2026-11-13_dog_0321": "Shepherd on the bridge",
    "2026-11-13_dog_0323": "Shepherd, walking",
    "2026-11-13_dog_0326": "Shepherd, waiting",
    "2026-11-12_cats_0187": "Cat on the track",
    "2026-11-12_cats_0200": "Cat and the stump",
    "2026-11-12_cats_0202": "Cat by the fence",
    "2026-11-12_cats_0204": "Cat, looking away",
    "2026-11-12_flowers-plants_0199": "Purple spike",
    "2026-11-13_flowers-plants_0290": "Lily pads and reeds",
    "2026-11-13_flowers-plants_0291": "Lily pads",
    "2026-11-13_flowers-plants_0361": "Dark stem",
    "2026-11-13_flowers-plants_0368": "Single stem",
    "2026-11-13_flowers-plants_0371": "Another single stem",
    "2026-11-13_flowers-plants_0372": "A pink one",
    "2026-11-13_flowers-plants_0382": "Dark lily pads",
    "2026-11-13_flowers-plants_0403": "New leaves",
    "2026-11-12_landscape_0088": "Benches, late light",
    "2026-11-13_landscape_0389": "Young tree",
    "2026-11-13_landscape_0393": "Branches against blue",
    "2026-11-13_landscape_0452": "Overgrown bridge",
    "2026-11-13_landscape_0491": "Pond edge",
    "2026-11-13_landscape_0513": "Pond, with duck",
    "2026-11-13_landscape_0515": "Pond, duck, small person",
    "2026-11-12_night_0236": "Moon over the lights",
    "2026-11-13_ducks_0482": "Mallards on the pond",
    "2026-11-13_ducks_0553": "Two ducks",
    "2026-11-13_geese_0410": "Goose, grazing",
    "2026-11-13_geese_0417": "Goose on the lawn",
    "2026-11-13_geese_0420": "Goose, staring",
    "2026-11-13_geese_0422": "Egyptian goose, profile",
    "2026-11-13_geese_0424": "Goose, preening",
    "2026-11-13_geese_0427": "Goose, still staring",
    "2026-11-13_geese_0596": "Goose leaving the water",
    "2026-11-13_geese_0597": "Goose, tidying up",
    "2026-11-13_geese_0611": "Goose in the clover",
    "2026-11-13_geese_0612": "Two geese, grazing",
    "2026-11-13_geese_0617": "Goose, mid-step",
    "2026-11-13_geese_0618": "Goose, next step",
    "2026-11-13_geese_0622": "Goose, leaving",
    "2026-11-13_sunset_0623": "The sun, leaving",
    "2026-11-13_sunset_0636": "Just after",
    "2026-11-13_water-fountain_0314": "Fountain",
  };

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const title = (p) => TITLES[p.slug] || p.title.charAt(0) + p.title.slice(1).toLowerCase();
  const ratio = (p) => p.width / p.height;
  const catOf = (p) => CAT_OF[p.category] || CATEGORIES[0];
  // Undated photos are filed under 2025 for now.
  const year = (p) => (p.date === "unknown" ? "2025" : p.date.slice(0, 4));

  function longDate(p) {
    if (p.date === "unknown") return "2025";
    const [y, m, d] = p.date.split("-").map(Number);
    let s = `${d} ${MONTHS[m - 1]} ${y}`;
    const t = p.exif && p.exif.datetime;
    if (t) s += `, ${t.slice(11, 16)}`;
    return s;
  }

  function shutter(v) {
    const n = Number(v);
    if (!n) return "";
    return n >= 0.3 ? `${n}s` : `1/${Math.round(1 / n)}`;
  }

  function exifLine(p) {
    const e = p.exif || {};
    if (!e.focal_mm) return p.camera_name;
    return [`${Math.round(e.focal_mm)}mm`, `f/${e.f_number}`, shutter(e.exposure)].join(" · ");
  }

  function group(p) {
    if (p.date === "2026-11-13") return "13 November 2026";
    if (p.date === "2026-11-12") return "12 November 2026";
    const y = year(p);
    return y === "2026" ? "Earlier in 2026" : y;
  }

  function sortKey(p) {
    const d = p.date === "unknown" ? "2025-00-00" : p.date;
    return d + ((p.exif && p.exif.datetime) || "") + p.slug;
  }

  const newestFirst = (a, b) => (sortKey(a) < sortKey(b) ? 1 : -1);

  function el(tag, attrs = {}, kids = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "class") n.className = v;
      else if (k === "style") n.style.cssText = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    }
    for (const k of [].concat(kids)) if (k) n.append(k);
    return n;
  }

  function img(p, big) {
    const a = {
      src: p.preview,
      alt: title(p) + (p.description ? `. ${p.description}` : ""),
      width: p.width,
      height: p.height,
      loading: big ? "eager" : "lazy",
      decoding: "async",
      style: `aspect-ratio:${p.width}/${p.height}`,
    };
    if (big) {
      a.srcset = `${p.preview} 1200w, ${p.master} ${Math.max(p.width, p.height)}w`;
      a.sizes = "100vw";
    }
    return el("img", a);
  }

  // A row of photos sized by their own shape, so none get cropped.
  function sized(node, p, basis) {
    node.style.flex = `${ratio(p).toFixed(3)} 1 ${Math.round(ratio(p) * basis)}px`;
    return node;
  }

  /* ---------------- springs ---------------- */

  function spring({ from, to, velocity = 0, response = 0.4, damping = 1, onUpdate, onDone }) {
    if (reduceMotion) {
      onUpdate(to);
      onDone && onDone();
      return () => {};
    }
    const w = (2 * Math.PI) / response;
    let x = from - to;
    let v = velocity;
    let last = performance.now();
    let id = requestAnimationFrame(step);
    function step(now) {
      const dt = Math.min(0.034, (now - last) / 1000) / 4;
      last = now;
      for (let i = 0; i < 4; i++) {
        v += (-w * w * x - 2 * damping * w * v) * dt;
        x += v * dt;
      }
      if (Math.abs(x) < 0.001 * Math.max(1, Math.abs(to - from)) && Math.abs(v) < 0.01 * Math.max(1, Math.abs(to - from))) {
        onUpdate(to);
        onDone && onDone();
        return;
      }
      onUpdate(to + x, v);
      id = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(id);
  }

  // Where a flick would come to rest.
  const project = (v, rate = 0.998) => ((v / 1000) * rate) / (1 - rate);

  function rubberband(over, size, c = 0.55) {
    return (over * size * c) / (size + c * Math.abs(over));
  }

  /* ---------------- glass ---------------- */

  const canRefract =
    !!(navigator.userAgentData && navigator.userAgentData.brands.some((b) => /Chromium/.test(b.brand))) &&
    !matchMedia("(prefers-reduced-transparency: reduce)").matches;

  let defs;
  const maps = new Map();
  let filterId = 0;

  function lensMap(w, h, r, bezel) {
    const key = [w, h, r, bezel].join("x");
    if (maps.has(key)) return maps.get(key);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const data = ctx.createImageData(w, h);
    const d = data.data;
    const hx = w / 2;
    const hy = h / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - hx;
        const py = y + 0.5 - hy;
        const qx = Math.abs(px) - (hx - r);
        const qy = Math.abs(py) - (hy - r);
        let nx = 0;
        let ny = 0;
        let dist;
        if (qx > 0 && qy > 0) {
          const l = Math.hypot(qx, qy) || 1;
          dist = r - l;
          nx = (qx / l) * Math.sign(px);
          ny = (qy / l) * Math.sign(py);
        } else if (qx > qy) {
          dist = hx - Math.abs(px);
          nx = Math.sign(px);
        } else {
          dist = hy - Math.abs(py);
          ny = Math.sign(py);
        }
        // Convex rim: flat in the middle, bending harder towards the edge.
        const t = Math.min(1, Math.max(0, dist) / bezel);
        const m = Math.pow(1 - t, 2.4);
        const i = (y * w + x) * 4;
        d[i] = 128 - nx * m * 127;
        d[i + 1] = 128 - ny * m * 127;
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(data, 0, 0);
    const url = c.toDataURL();
    maps.set(key, url);
    return url;
  }

  function refract(node) {
    const rect = node.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (!w || !h) return;
    if (node._glass && node._glass.w === w && node._glass.h === h) return;
    const r = Math.min(parseFloat(getComputedStyle(node).borderTopLeftRadius) || 0, h / 2, w / 2);
    const thick = node.classList.contains("regular");
    const bezel = Math.max(8, Math.min(r || 16, 26));
    const scale = Math.min(thick ? 52 : 40, bezel * 1.8);
    const blur = thick ? 4.5 : 1.4;
    const map = lensMap(w, h, Math.max(r, 0.01), bezel);
    const id = node._glass ? node._glass.id : `lg${++filterId}`;
    const NS = "http://www.w3.org/2000/svg";
    let f = defs.querySelector(`#${id}`);
    if (!f) {
      f = document.createElementNS(NS, "filter");
      f.id = id;
      defs.append(f);
    }
    const channel = (name, k, mat) =>
      `<feDisplacementMap in="soft" in2="map" scale="${(scale * k).toFixed(1)}" xChannelSelector="R" yChannelSelector="G" result="d${name}"/>` +
      `<feColorMatrix in="d${name}" type="matrix" values="${mat}" result="${name}"/>`;
    f.setAttribute("x", "0");
    f.setAttribute("y", "0");
    f.setAttribute("width", w);
    f.setAttribute("height", h);
    f.setAttribute("filterUnits", "userSpaceOnUse");
    f.setAttribute("color-interpolation-filters", "sRGB");
    // Each colour channel bends a little differently, like real glass.
    f.innerHTML =
      `<feImage href="${map}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>` +
      `<feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" edgeMode="duplicate" result="soft"/>` +
      channel("r", 1, "1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0") +
      channel("g", 1.07, "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0") +
      channel("b", 1.14, "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0") +
      `<feBlend in="r" in2="g" mode="screen" result="rg"/>` +
      `<feBlend in="rg" in2="b" mode="screen" result="rgb"/>` +
      `<feColorMatrix in="rgb" type="saturate" values="${thick ? 1.6 : 1.8}"/>`;
    node.style.setProperty("--refract", `url(#${id}) brightness(${thick ? 1 : 1.08})`);
    node._glass = { id, w, h };
  }

  function setupGlass() {
    const all = () => document.querySelectorAll(".glass");
    if (canRefract) {
      document.documentElement.classList.add("refract");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("aria-hidden", "true");
      svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg.append(defs);
      document.body.append(svg);
      const ro = new ResizeObserver((entries) => entries.forEach((e) => refract(e.target)));
      const watch = () => all().forEach((n) => { if (!n._watched) { n._watched = true; ro.observe(n); } });
      watch();
      new MutationObserver(watch).observe(document.body, { childList: true, subtree: true });
    }
    // Light follows the pointer across each pane.
    document.addEventListener("pointermove", (e) => {
      const g = e.target.closest && e.target.closest(".glass");
      if (!g) return;
      const r = g.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      g.style.setProperty("--lx", `${(x * 100).toFixed(1)}%`);
      g.style.setProperty("--ly", `${(y * 100 - 40).toFixed(1)}%`);
      g.style.setProperty("--rim-angle", `${Math.round(180 + (x - 0.5) * 60)}deg`);
    }, { passive: true });
    document.addEventListener("pointerout", (e) => {
      const g = e.target.closest && e.target.closest(".glass");
      if (g && !g.contains(e.relatedTarget)) {
        g.style.removeProperty("--lx");
        g.style.removeProperty("--ly");
        g.style.removeProperty("--rim-angle");
      }
    });
  }

  /* ---------------- reveal on scroll ---------------- */

  const io = "IntersectionObserver" in window && !reduceMotion
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 })
    : null;

  function reveal(node, delay = 0) {
    if (!io) return node;
    node.classList.add("reveal");
    if (delay) node.style.transitionDelay = `${delay}ms`;
    io.observe(node);
    return node;
  }

  /* ---------------- viewer ---------------- */

  const icon = (d) => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

  const viewer = (() => {
    let root, stage, pic, backdrop, chrome, label, count, h2, when, exif, full, prevBtn, nextBtn;
    let list = [];
    let index = 0;
    let origin = null;
    let lastFocus = null;
    let x = 0, y = 0, p = 1, flip = { dx: 0, dy: 0, s: 1 };
    let stopX, stopY, stopP;

    function build() {
      root = el("div", { class: "lb", role: "dialog", "aria-modal": "true", "aria-label": "Photo viewer", hidden: "" });
      backdrop = el("div", { class: "lb-backdrop" });
      pic = el("img", { class: "lb-img", alt: "", draggable: "false" });
      stage = el("div", { class: "lb-stage" }, pic);
      const close = el("button", { class: "glass round lb-close press", type: "button", "aria-label": "Close" });
      close.innerHTML = icon('<path d="M5 5l10 10M15 5L5 15"/>');
      label = el("b");
      count = el("span", { class: "mono" });
      const top = el("div", { class: "lb-top" }, [close, el("span", { class: "glass lb-count" }, [label, count])]);
      prevBtn = el("button", { class: "glass round lb-prev press", type: "button", "aria-label": "Previous photo" });
      prevBtn.innerHTML = icon('<path d="M12 4l-6 6 6 6"/>');
      nextBtn = el("button", { class: "glass round lb-next press", type: "button", "aria-label": "Next photo" });
      nextBtn.innerHTML = icon('<path d="M8 4l6 6-6 6"/>');
      h2 = el("h2");
      when = el("p");
      exif = el("dl", { class: "lb-exif" });
      full = el("a", { class: "btn glass press", target: "_blank", rel: "noopener", text: "Full size" });
      const ask = el("a", { class: "btn accent press", href: CONTACT, target: "_blank", rel: "noopener", text: "Ask to use" });
      const info = el("div", { class: "glass regular lb-info" }, [
        el("div", { class: "lb-title" }, [h2, when]),
        exif,
        el("div", { class: "lb-actions" }, [full, ask]),
      ]);
      chrome = [top, prevBtn, nextBtn, info];
      root.append(backdrop, stage, ...chrome);
      document.body.append(root);

      close.addEventListener("click", hide);
      prevBtn.addEventListener("click", () => step(-1));
      nextBtn.addEventListener("click", () => step(1));
      backdrop.addEventListener("click", hide);
      root.addEventListener("keydown", onKey);
      drag();
    }

    function paint() {
      const s = flip.s + (1 - flip.s) * p;
      pic.style.transform = `translate3d(${x + flip.dx * (1 - p)}px, ${y + flip.dy * (1 - p)}px, 0) scale(${s * (1 - Math.max(0, y) / 2400)})`;
      const fade = Math.min(1, p) * (1 - Math.min(0.7, Math.max(0, y) / 420));
      backdrop.style.opacity = fade;
      chrome.forEach((c) => (c.style.opacity = root.classList.contains("bare") ? 0 : Math.max(0, fade * 1.2 - 0.2)));
    }

    function fill() {
      const ph = list[index];
      pic.src = ph.preview;
      pic.width = ph.width;
      pic.height = ph.height;
      pic.alt = title(ph);
      const big = new Image();
      big.onload = () => { if (list[index] === ph) pic.src = ph.master; };
      big.src = ph.master;
      label.textContent = catOf(ph).name;
      count.textContent = `${index + 1} / ${list.length}`;
      h2.textContent = title(ph);
      when.textContent = longDate(ph);
      const e = ph.exif || {};
      const rows = [["Camera", e.model || ph.camera_name, "cam"]];
      if (e.focal_mm) {
        rows.push(["Focal", `${Math.round(e.focal_mm)}mm`], ["Aperture", `f/${e.f_number}`], ["Shutter", shutter(e.exposure)], ["ISO", String(e.iso)]);
      }
      exif.replaceChildren(...rows.map(([k, v, c]) => el("div", { class: c }, [el("dt", { text: k }), el("dd", { text: v })])));
      full.href = ph.master;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === list.length - 1;
      prevBtn.style.visibility = index === 0 ? "hidden" : "";
      nextBtn.style.visibility = index === list.length - 1 ? "hidden" : "";
      [list[index - 1], list[index + 1]].forEach((n) => n && (new Image().src = n.preview));
    }

    function sourceRect() {
      if (!origin || !document.contains(origin)) return null;
      const r = origin.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return null;
      return r;
    }

    function measureFlip() {
      const r = sourceRect();
      const was = pic.style.transform;
      pic.style.transform = "none";
      const f = pic.getBoundingClientRect();
      pic.style.transform = was;
      if (!r || !f.width) return { dx: 0, dy: 30, s: 0.92 };
      return {
        dx: r.left + r.width / 2 - (f.left + f.width / 2),
        dy: r.top + r.height / 2 - (f.top + f.height / 2),
        s: r.width / f.width,
      };
    }

    function show(items, i, from) {
      if (!root) build();
      list = items;
      index = i;
      origin = from;
      lastFocus = document.activeElement;
      root.classList.remove("bare");
      fill();
      root.hidden = false;
      document.body.classList.add("locked");
      x = 0; y = 0; p = 0;
      pic.style.transform = "none";
      requestAnimationFrame(() => {
        flip = measureFlip();
        paint();
        stopP && stopP();
        stopP = spring({ from: 0, to: 1, response: 0.45, onUpdate: (v) => { p = v; paint(); } });
        root.querySelector(".lb-close").focus({ preventScroll: true });
      });
    }

    function hide() {
      if (!root || root.hidden) return;
      stopP && stopP();
      stopX && stopX();
      stopY && stopY();
      origin = originFor(list[index]) || origin;
      flip = measureFlip();
      const fromX = x, fromY = y;
      stopP = spring({
        from: p, to: 0, response: 0.4,
        onUpdate: (v) => { p = v; x = fromX * v; y = fromY * v; paint(); },
        onDone: () => {
          root.hidden = true;
          document.body.classList.remove("locked");
          if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
        },
      });
    }

    let originFor = () => null;

    function step(dir, velocity = 0) {
      const next = index + dir;
      if (next < 0 || next >= list.length) {
        stopX && stopX();
        stopX = spring({ from: x, to: 0, velocity, response: 0.35, onUpdate: (v) => { x = v; paint(); } });
        return;
      }
      const width = stage.clientWidth;
      stopX && stopX();
      stopX = spring({
        from: x, to: -dir * width * 0.9, velocity, response: 0.28,
        onUpdate: (v) => { x = v; paint(); },
        onDone: () => {
          index = next;
          fill();
          x = dir * width * 0.6;
          paint();
          stopX = spring({ from: x, to: 0, response: 0.4, damping: 0.86, onUpdate: (v) => { x = v; paint(); } });
        },
      });
    }

    function onKey(e) {
      if (e.key === "Escape") hide();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        const f = [...root.querySelectorAll("button:not([disabled]), a[href]")].filter((n) => n.offsetParent && n.style.visibility !== "hidden");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    function drag() {
      let start = null;
      let axis = null;
      let hist = [];
      stage.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        stage.setPointerCapture(e.pointerId);
        stopX && stopX();
        stopY && stopY();
        start = { x: e.clientX - x, y: e.clientY - y, cx: e.clientX, cy: e.clientY };
        axis = null;
        hist = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }];
      });
      stage.addEventListener("pointermove", (e) => {
        if (!start) return;
        const dx = e.clientX - start.cx;
        const dy = e.clientY - start.cy;
        if (!axis) {
          if (Math.hypot(dx, dy) < 10) return;
          axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        }
        hist.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
        if (hist.length > 6) hist.shift();
        if (axis === "x") {
          let nx = e.clientX - start.x;
          const atEnd = (nx > 0 && index === 0) || (nx < 0 && index === list.length - 1);
          x = atEnd ? rubberband(nx, stage.clientWidth) : nx;
        } else {
          const ny = e.clientY - start.y;
          y = ny < 0 ? rubberband(ny, stage.clientHeight) : ny;
        }
        paint();
      });
      const end = (e) => {
        if (!start) return;
        const moved = axis;
        start = null;
        if (!moved) {
          if (e.type === "pointerup") {
            root.classList.toggle("bare");
            paint();
          }
          return;
        }
        const a = hist[0], b = hist[hist.length - 1];
        const dt = Math.max(1, b.t - a.t) / 1000;
        const vx = (b.x - a.x) / dt;
        const vy = (b.y - a.y) / dt;
        if (moved === "x") {
          const land = x + project(vx);
          const w = stage.clientWidth;
          if (land < -w / 3) step(1, vx);
          else if (land > w / 3) step(-1, vx);
          else stopX = spring({ from: x, to: 0, velocity: vx, response: 0.35, onUpdate: (v) => { x = v; paint(); } });
        } else {
          if (y + project(vy) > 180) hide();
          else stopY = spring({ from: y, to: 0, velocity: vy, response: 0.35, onUpdate: (v) => { y = v; paint(); } });
        }
      };
      stage.addEventListener("pointerup", end);
      stage.addEventListener("pointercancel", end);
    }

    return {
      open: show,
      setOrigins(fn) { originFor = fn; },
    };
  })();

  function opener(items, i, btn) {
    btn.addEventListener("click", () => viewer.open(items, i, btn.querySelector("img")));
  }

  /* ---------------- home ---------------- */

  const SELECTED = [
    ["2026-11-13_birds_0455", "2026-11-13_flowers-plants_0372"],
    ["hoopoe-in-the-grass", "2026-11-13_birds_0298", "2026-11-13_flowers-plants_0291"],
    ["quiet-water", "2026-11-13_ducks_0553"],
  ];
  const FEATURE = "2026-11-13_sunset_0623";

  function home() {
    const geese = PHOTOS.filter((p) => p.category === "geese").length;
    const share = PHOTOS.length ? ((geese / PHOTOS.length) * 100).toFixed(2).replace(/\.?0+$/, "") : 0;
    const cams = new Set(PHOTOS.map((p) => p.camera)).size;
    const stats = document.getElementById("stats");
    if (stats) {
      stats.replaceChildren(
        reveal(el("div", { class: "stat" }, [el("b", { text: PHOTOS.length }), el("span", { text: "photographs" })])),
        reveal(el("div", { class: "stat" }, [el("b", { text: cams }), el("span", { text: "cameras" })]), 80),
        reveal(el("div", { class: "stat hl" }, [el("b", { text: `${share}%` }), el("span", { text: `geese. That's ${geese} of them.` })]), 160),
      );
    }

    const picks = SELECTED.flat().concat(FEATURE).map((s) => BY_SLUG[s]).filter(Boolean);
    const work = document.getElementById("work");
    if (work) {
      work.replaceChildren(
        ...SELECTED.map((row) => {
          const r = el("div", { class: "row" });
          row.map((s) => BY_SLUG[s]).filter(Boolean).forEach((p, j) => {
            const btn = el("button", { type: "button", "aria-label": `Open ${title(p)}` }, el("span", { class: "tile" }, img(p)));
            opener(picks, picks.indexOf(p), btn);
            r.append(reveal(sized(el("figure", { class: "work-item" }, [
              btn,
              el("figcaption", {}, [el("b", { text: title(p) }), el("span", { class: "mono muted", text: exifLine(p) })]),
            ]), p, 200), j * 90));
          });
          return r;
        }),
      );
    }

    const feat = BY_SLUG[FEATURE];
    const featBox = document.getElementById("feature-photo");
    if (feat && featBox) {
      const btn = el("button", { type: "button", "aria-label": `Open ${title(feat)}`, class: "grow" }, el("span", { class: "tile" }, img(feat, true)));
      opener(picks, picks.indexOf(feat), btn);
      featBox.replaceChildren(btn);
    }

    const cats = document.getElementById("cats");
    if (cats) {
      const rows = [CATEGORIES.slice(0, 3), CATEGORIES.slice(3)];
      cats.replaceChildren(
        ...rows.map((row) => {
          const r = el("div", { class: "row" });
          row.forEach((c, j) => {
            const p = BY_SLUG[c.cover];
            if (!p) return;
            const n = PHOTOS.filter((q) => catOf(q) === c).length;
            const g = c.id === "birds" ? geese : 0;
            r.append(reveal(sized(el("a", { class: "cat press", href: `gallery.html#${c.id}` }, [
              el("span", { class: "tile" }, img(p)),
              el("span", { class: "cat-name" }, [el("b", { text: c.name }), el("span", { text: `${n} photographs${g ? `, ${g} of them geese` : ""}` })]),
            ]), p, 200), j * 90));
          });
          return r;
        }),
      );
    }
    viewer.setOrigins((p) => document.querySelector(`#work img[src="${p.preview}"], #feature-photo img`));
  }

  /* ---------------- gallery ---------------- */

  const ORDER = ["13 November 2026", "12 November 2026", "Earlier in 2026", "2025", "2024"];

  function gallery() {
    const bar = document.getElementById("filters");
    const out = document.getElementById("groups");
    const heading = document.getElementById("heading");
    const sub = document.getElementById("sub");
    if (!bar || !out) return;

    const chips = [{ id: "all", name: "All" }].concat(CATEGORIES).map((c) => {
      const n = c.id === "all" ? PHOTOS.length : PHOTOS.filter((p) => catOf(p) === c).length;
      const b = el("button", { class: "chip", type: "button", "aria-pressed": "false", "data-id": c.id }, [
        el("span", { text: c.name }),
        el("span", { class: "mono", text: n }),
      ]);
      b.addEventListener("click", () => {
        history.replaceState(null, "", c.id === "all" ? location.pathname : `#${c.id}`);
        render(c.id);
      });
      return b;
    });
    bar.replaceChildren(...chips);

    let current = null;
    let shown = [];

    function render(id) {
      if (!CATEGORIES.some((c) => c.id === id)) id = "all";
      if (id === current) return;
      current = id;
      chips.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
      const cat = CATEGORIES.find((c) => c.id === id);
      shown = PHOTOS.filter((p) => !cat || catOf(p) === cat).sort(newestFirst);
      heading.textContent = cat ? cat.name : "Gallery";
      sub.textContent = `${shown.length} photograph${shown.length === 1 ? "" : "s"}, newest first.`;
      document.title = `${cat ? cat.name : "Gallery"} · Yuval Kolodkin-Gal`;

      const sections = ORDER.map((name) => ({ name, items: shown.filter((p) => group(p) === name) })).filter((s) => s.items.length);
      out.classList.remove("swap");
      void out.offsetWidth;
      out.classList.add("swap");
      out.replaceChildren(
        ...sections.map((s) => {
          const grid = el("div", { class: "just" });
          s.items.forEach((p, i) => {
            const btn = el("button", { type: "button", "aria-label": `Open ${title(p)}` }, el("span", { class: "tile" }, img(p)));
            opener(shown, shown.indexOf(p), btn);
            grid.append(reveal(sized(btn, p, innerWidth < 761 ? 100 : 150), (i % 5) * 50));
          });
          return el("section", {}, [
            el("div", { class: "group-title" }, [el("h2", { text: s.name }), el("span", { text: `${s.items.length} photograph${s.items.length === 1 ? "" : "s"}` })]),
            grid,
          ]);
        }),
      );
    }

    viewer.setOrigins((p) => out.querySelector(`img[src="${p.preview}"]`));
    addEventListener("hashchange", () => render(location.hash.slice(1)));
    render(location.hash.slice(1));
  }

  /* ---------------- boot ---------------- */

  setupGlass();
  if (document.body.dataset.page === "home") home();
  if (document.body.dataset.page === "gallery") gallery();
  document.querySelectorAll("[data-reveal]").forEach((n, i) => reveal(n, (i % 3) * 80));
})();
