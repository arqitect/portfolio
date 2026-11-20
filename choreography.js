// Pure scroll framing and interpolation.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const framesFor = (slides, phone) => slides.map(el => {
  const r = +el.dataset.focus;
  // one continuous pose: the tilt never changes between projects. On a phone the molecule glides along its own
  // length, bringing each project's residue (R2, F5, Y9: left to right along the name) to the centre as you scroll
  if (!r) return phone ? { res: 0, zoom: 1.05, sx: 0.5, sy: 0.885, tilt: -0.06 } : { res: 0, zoom: 1, dx: 0, sy: 0.5, tilt: Math.PI / 2 - 0.04 };
  if (!phone) return { res: r, zoom: 1.08, dx: 0, sy: 0.5, tilt: Math.PI / 2 - 0.04, label: el.dataset.label };
  // pan: how far toward centring the residue it slides (1 = all the way, so the far end juts well off-screen)
  return { res: r, zoom: 1.5, sx: 0.5, sy: 0.885, pan: 0.85, tilt: -0.06, label: el.dataset.label };
});
