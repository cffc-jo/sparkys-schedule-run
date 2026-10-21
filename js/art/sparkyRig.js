// Sparky, built from a tiny pixel-art "rig" (design G: profile head with one big friendly eye,
// rounded snout and floppy ear, on a springy athletic body).
// Parts are rasterised as shapes on a grid, each with its own 1px outline, and layered back to
// front; facial features are hand-drawn stamps so they stay crisp. Every frame is posed from joint
// angles, so the run has a lean, bob, knee bend and arm swing instead of stiff sliding legs.
// Output: frames as arrays of strings (one character per pixel, keys from PIXEL_COLORS).

export const FW = 30; // frame width
export const FH = 36; // frame height (feet sit on the bottom row)

const ell = (cx, cy, rx, ry) => (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
const cap = (ax, ay, bx, by, r) => (x, y) => {
  const px = x + 0.5, py = y + 0.5, dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2 <= r * r;
};
const union = (...fs) => (x, y) => fs.some((f) => f(x, y));
const rrect = (x0, y0, x1, y1, r) => (x, y) => {
  const px = x + 0.5, py = y + 0.5;
  if (px < x0 || px > x1 || py < y0 || py > y1) return false;
  const cx = Math.min(Math.max(px, x0 + r), x1 - r), cy = Math.min(Math.max(py, y0 + r), y1 - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
};

const newGrid = () => Array.from({ length: FH }, () => Array(FW).fill(null));

// Fill a shape (colour or per-pixel colour function) and give it its own 1px outline
function paint(g, fn, fill, outline = true) {
  const m = newGrid();
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) m[y][x] = fn(x, y);
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    if (m[y][x]) g[y][x] = typeof fill === 'function' ? fill(x, y) : fill;
    else if (outline && (m[y][x - 1] || m[y][x + 1] || (m[y - 1] && m[y - 1][x]) || (m[y + 1] && m[y + 1][x]))) g[y][x] = 'K';
  }
}
function px(g, x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (y >= 0 && y < FH && x >= 0 && x < FW) g[y][x] = c;
}

// Hand-drawn feature stamps ('.' = leave as is)
const STAMP = {
  eye:      ['.KKK.', 'KWWWK', 'KWWKK', 'KWWKK', 'KWWWK', '.KKK.'], // big friendly eye, pupil looking ahead
  happy:    ['.....', '.KKK.', 'K...K'],                            // closed "^" eye
  dizzy:    ['K...K', '.K.K.', '..K..', '.K.K.', 'K...K'],          // X eye when hit
  nose:     ['.KKK.', 'KWKKK', 'KKKKK', '.KKK.'],                   // big black nose with a shine
  crown:    ['KKKK', '.KK.'],                                       // crown spot
};
function stamp(g, name, x, y) {
  STAMP[name].forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch !== '.') px(g, x + dx, y + dy, ch); }));
}

// ---- Design G ----
const BODY = {
  torsoX: 13, torsoRX: 4.8, hipX: 13, hipY: 25.5, shX: 14.5, shY: 18,
  thigh: 4, shin: 4.2, legR: 1.25, armR: 1.1, fist: 1.6,
  stride: 2.6, armSwing: 3, bounce: 1.6, lean: 1,
};
const HEAD = {
  skull: [12, 9, 6, 6],           // round skull
  muzzle: [18.4, 11.4, 4.3, 3],   // rounded snout
  nose: [19.6, 8.4],
  eye: [12.5, 5],
  earFront: [7.6, 10.6, 2.8, 5.2], // floppy ear with a black tip
  earFlap: [6.6, 9, 3, 4.6],       // ear lifted mid-stride
  crown: [8.5, 2.6],
  chin: [16.5, 14.6],
  mouth: [[15, 12.4], [16, 13.2], [17, 13.2], [18, 13.2], [19, 13.2], [20, 12.4]],
  tongue: [[17, 14], [18, 14]],
};

function drawLeg(g, b, leg, bob) {
  const hip = [b.hipX + leg.hipDX, b.hipY + bob];
  const knee = [hip[0] + leg.knee[0], hip[1] + leg.knee[1]];
  const foot = [knee[0] + leg.foot[0], knee[1] + leg.foot[1]];
  paint(g, union(cap(...hip, ...knee, b.legR + 0.3), cap(...knee, ...foot, b.legR)), 'W');
  px(g, (hip[0] + knee[0]) / 2, (hip[1] + knee[1]) / 2 + 0.5, 'K'); // Dalmatian spot
  paint(g, ell(foot[0] + 1.2, foot[1] + 0.6, 2.4, 1.3), 'K');          // cleat
}

function drawArm(g, b, arm, bob, lean) {
  const sh = [b.shX + lean + arm.shDX, b.shY + bob];
  const el = [sh[0] + arm.el[0], sh[1] + arm.el[1]];
  const hand = [el[0] + arm.hand[0], el[1] + arm.hand[1]];
  const sleeve = cap(sh[0], sh[1], sh[0] + arm.el[0] * 0.45, sh[1] + arm.el[1] * 0.45, b.armR + 0.45);
  paint(g, union(cap(...sh, ...el, b.armR + 0.25), cap(...el, ...hand, b.armR), sleeve), (x, y) => (sleeve(x, y) ? 'R' : 'W'));
  paint(g, ell(hand[0], hand[1], b.fist, b.fist), 'K', false); // black fist
}

// Red home jersey (shirt shape, plain white chest band) and red shorts
function drawTorso(g, b, bob, lean) {
  const top = b.shY - 1.6 + bob, waist = b.hipY - 1.2 + bob, bottom = b.hipY + 1.8 + bob;
  const cx = b.torsoX + lean * 0.5, hw = b.torsoRX;
  const shirt = rrect(cx - hw, top, cx + hw, waist + 0.6, 2.2);
  const shorts = rrect(b.torsoX - hw + 0.4, waist - 0.4, b.torsoX + hw - 0.4, bottom, 1.2);
  const bandY = Math.round(top + (waist - top) * 0.38);
  paint(g, union(shirt, shorts), (x, y) => {
    if (y + 0.5 >= waist && shorts(x, y)) {
      if (Math.round(y) === Math.round(waist)) return 'D';
      return (x === Math.round(b.torsoX) && y + 0.5 > waist + 1.5) ? 'X' : 'R';
    }
    if (y === bandY || y === bandY + 1) return 'W';
    if (!shirt(x - 1, y)) return 'F';
    if (!shirt(x + 1, y)) return 'D';
    return 'R';
  });
}

function drawHead(g, h, ox, oy, eyes = 'eye', flap = false) {
  const X = (v) => v + ox, Y = (v) => v + oy;
  paint(g, union(ell(X(h.skull[0]), Y(h.skull[1]), h.skull[2], h.skull[3]), ell(X(h.muzzle[0]), Y(h.muzzle[1]), h.muzzle[2], h.muzzle[3])), 'W');
  stamp(g, 'crown', X(h.crown[0]), Y(h.crown[1]));
  px(g, X(h.chin[0]), Y(h.chin[1]), 'K');
  if (eyes === 'happy') stamp(g, 'happy', X(h.eye[0]), Y(h.eye[1]) + 2);
  else if (eyes === 'dizzy') stamp(g, 'dizzy', X(h.eye[0]), Y(h.eye[1]) + 0.5);
  else stamp(g, 'eye', X(h.eye[0]), Y(h.eye[1]));
  stamp(g, 'nose', X(h.nose[0]), Y(h.nose[1]));
  for (const [mx, my] of h.mouth) px(g, X(mx), Y(my), 'K');
  for (const [tx, ty] of h.tongue) px(g, X(tx), Y(ty), 'F');
  const e = flap ? h.earFlap : h.earFront;
  paint(g, ell(X(e[0]), Y(e[1]), e[2], e[3]), (x, y) => (y + 0.5 - Y(e[1]) > e[3] * 0.2 ? 'K' : 'W'));
}

// ---- Poses (joint offsets) ----
function runPose(t, b) {
  const a = t * Math.PI * 2;
  const leg = (ph) => {
    const sw = Math.sin(a + ph), lift = Math.max(0, Math.cos(a + ph));
    return { hipDX: 0, knee: [b.stride * sw * 0.7 + 1.5 * lift, b.thigh - 1.2 * lift], foot: [b.stride * sw * 0.4 - 1.8 * lift, b.shin - 2.6 * lift] };
  };
  const arm = (ph) => {
    const sw = Math.sin(a + ph);
    return { shDX: 0, el: [b.armSwing * sw, 3.4], hand: [b.armSwing * 0.9 * sw + 1.6, 2.4 - 1.6 * Math.abs(sw)] };
  };
  return { legF: leg(0), legB: leg(Math.PI), armF: arm(Math.PI), armB: arm(0), bob: -Math.round(Math.abs(Math.cos(a)) * b.bounce), lean: b.lean };
}
const idlePose = (b) => ({
  legF: { hipDX: 1, knee: [0.4, b.thigh], foot: [0, b.shin] },
  legB: { hipDX: -1.5, knee: [-0.4, b.thigh], foot: [0, b.shin] },
  armF: { shDX: 1, el: [1.6, 3.2], hand: [0.4, 3] },
  armB: { shDX: -3, el: [-1.2, 3.2], hand: [-0.4, 3] },
  bob: 0, lean: 0,
});
const jumpPose = (b) => ({
  legF: { hipDX: 1, knee: [3, b.thigh - 3], foot: [-1, b.shin - 1] },
  legB: { hipDX: -1, knee: [-2.5, b.thigh - 1], foot: [-2, b.shin - 1] },
  armF: { shDX: 0, el: [2.5, -3], hand: [1.5, -3] },
  armB: { shDX: -1, el: [-2.5, -2], hand: [-1.5, -3] },
  bob: -2, lean: 1,
});
// Victory fist pump: front fist punched up in front of the chin, back arm raised behind the head
const fistPump = (hy) => ({ armF: { shDX: 0, el: [3.5, -0.5], hand: [3, hy] }, armB: { shDX: -2, el: [-1, -3.6], hand: [-0.6, -3] } });
// Knocked silly: arms flung out to both sides
const flail = { armF: { shDX: 0, el: [3, 1.5], hand: [1.5, -1.5] }, armB: { shDX: -2, el: [-3, 1.5], hand: [-1.5, -1.5] } };

function compose(pose, opts = {}) {
  const g = newGrid(), b = BODY;
  drawArm(g, b, pose.armB, pose.bob, pose.lean);
  drawLeg(g, b, pose.legB, pose.bob);
  drawTorso(g, b, pose.bob, pose.lean);
  drawLeg(g, b, pose.legF, pose.bob);
  drawHead(g, HEAD, (opts.headX ?? 0) + pose.lean, (opts.headY ?? 0) + pose.bob, opts.eyes, opts.flap);
  drawArm(g, b, pose.armF, pose.bob, pose.lean);
  return g;
}

// Duck: crouched low with the head pushed forward beside the shoulders (stays well under the
// hanging boxes)
function duckFrame() {
  const b = BODY, g = newGrid(), bob = 7;
  drawArm(g, b, { shDX: -2, el: [-1, 2.4], hand: [0.5, 1.4] }, bob, 1);
  drawLeg(g, b, { hipDX: -1.5, knee: [-2.6, -0.4], foot: [-0.2, 1.4] }, bob);
  drawTorso(g, b, bob, 1);
  drawLeg(g, b, { hipDX: 1, knee: [3, -0.4], foot: [-0.4, 1.4] }, bob);
  drawHead(g, HEAD, 5, 17);
  drawArm(g, b, { shDX: 1, el: [2, 2.2], hand: [1, 1.2] }, bob, 1);
  return g;
}

const toRows = (g) => g.map((row) => row.map((k) => k || '.').join(''));

export function buildSparkyFrames() {
  const b = BODY;
  const run = (t, flap) => toRows(compose(runPose(t, b), { flap }));
  const hitPose = { ...runPose(0.25, b), ...flail, bob: 0, lean: -1 };
  return {
    idle0: toRows(compose(idlePose(b))),
    idle1: toRows(compose(idlePose(b), { eyes: 'happy' })),
    run0: run(0, false),
    run1: run(0.25, true),
    run2: run(0.5, false),
    run3: run(0.75, true),
    jump: toRows(compose(jumpPose(b), { flap: true })),
    spin: toRows(compose(jumpPose(b), { eyes: 'happy', flap: true })),
    duck: toRows(duckFrame()),
    hit: toRows(compose(hitPose, { eyes: 'dizzy', flap: true })),
    victory0: toRows(compose({ ...idlePose(b), ...fistPump(-1.4) }, { eyes: 'happy' })),
    victory1: toRows(compose({ ...jumpPose(b), ...fistPump(-2.2) }, { eyes: 'happy', flap: true })),
  };
}

// Just the head, cropped (favicon / app icon)
export function buildSparkyHead() {
  const g = newGrid();
  drawHead(g, HEAD, 0, 0);
  const rows = toRows(g);
  const used = rows.map((r, y) => (/[^.]/.test(r) ? y : -1)).filter((y) => y >= 0);
  const cols = [];
  rows.forEach((r) => [...r].forEach((ch, x) => { if (ch !== '.') cols.push(x); }));
  const x0 = Math.min(...cols), x1 = Math.max(...cols);
  return rows.slice(used[0], used[used.length - 1] + 1).map((r) => r.slice(x0, x1 + 1));
}
