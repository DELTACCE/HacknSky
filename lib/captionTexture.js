// Draws the pieces of an in-world caption onto 2D canvases (outlined, gradient
// filled, with a soft shadow, MiSide style). WorldCaptions turns each canvas
// into a texture on a quad that lives in the 3D scene. No three.js in here.

export const WEIGHT = { black: 800, semi: 600 };
export const PX = { black: 150, semi: 76 }; // texture resolution per font size
const BASELINE = 0.7; // baseline position as a fraction of canvas height
export const CAP_MID = 0.35; // visual centre of caps above baseline, in em

export const fontString = (kind, family) => `${WEIGHT[kind]} ${PX[kind]}px ${family}`;

// Measure a line and split it into letters or words, all in em units
// (multiples of the font size) so layout is independent of texture resolution.
export function measureLine(ctx, line, family) {
  const px = PX[line.font];
  const ls = (line.ls || 0) * px;
  const text = line.t;
  ctx.font = fontString(line.font, family);
  const adv = (n) => ctx.measureText(text.slice(0, n)).width + n * ls;
  const total = adv(text.length) - ls;

  const spans = [];
  if (line.unit === "char") {
    for (let i = 0; i < text.length; i++) if (text[i] !== " ") spans.push([i, i + 1]);
  } else {
    let i = 0;
    while (i < text.length) {
      if (text[i] === " ") {
        i++;
        continue;
      }
      let j = i;
      while (j < text.length && text[j] !== " ") j++;
      spans.push([i, j]);
      i = j;
    }
  }
  const units = spans.map(([i0, i1]) => {
    const x0 = adv(i0);
    const x1 = adv(i1) - ls;
    return { t: text.slice(i0, i1), x0: x0 / px, w: (x1 - x0) / px, i0, i1 };
  });
  return { emW: total / px, units };
}

// Paint one unit. kind "front" = outlined gradient letters, "back" = a plain dark
// silhouette that sits a hair behind to give the letters thickness.
export function drawUnit(canvas, unit, line, family, kind, fills) {
  const px = PX[line.font];
  const pad = Math.ceil(px * 0.3);
  const w = Math.max(4, Math.ceil(unit.w * px) + pad * 2);
  const h = Math.ceil(px * 1.7);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  ctx.font = fontString(line.font, family);
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  const by = Math.round(h * BASELINE);
  const ls = (line.ls || 0) * px;

  const run = (fn) => {
    if (!ls) {
      fn(unit.t, pad);
      return;
    }
    let x = pad;
    for (const ch of unit.t) {
      fn(ch, x);
      x += ctx.measureText(ch).width + ls;
    }
  };

  if (kind === "back") {
    ctx.fillStyle = "#04150f";
    ctx.strokeStyle = "#04150f";
    ctx.lineWidth = px * line.outline * 2;
    run((s, x) => ctx.strokeText(s, x, by));
    run((s, x) => ctx.fillText(s, x, by));
    return { cw: w, ch: h, by };
  }

  // 1. outline with a soft shadow beneath it
  ctx.strokeStyle = "#0b2b24";
  ctx.lineWidth = px * line.outline * 2;
  ctx.shadowColor = "rgba(4, 21, 15, 0.55)";
  ctx.shadowBlur = px * 0.1;
  ctx.shadowOffsetY = px * 0.05;
  run((s, x) => ctx.strokeText(s, x, by));
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 2. gradient fill, top to bottom across the cap height
  const g = ctx.createLinearGradient(0, by - px * 0.78, 0, by + px * 0.06);
  g.addColorStop(0, fills[0]);
  g.addColorStop(1, fills[1]);
  ctx.fillStyle = g;
  run((s, x) => ctx.fillText(s, x, by));
  return { cw: w, ch: h, by };
}
