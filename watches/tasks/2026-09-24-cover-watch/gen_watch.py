#!/usr/bin/env python3
"""Generate the cover slide's skeleton watch in the "Line, weighted" style.

    python3 gen_watch.py                       # writes ./out/skeleton-watch.svg
    python3 gen_watch.py out.svg               # writes there
    python3 gen_watch.py out.svg --at 490 276  # the watch centre on the canvas

Stdlib only. The file fills the slide: width 980, height 552, and a viewBox of
the same size, so one unit is one CSS px. It uses the four art colours of
stem/docs/illustrations.md and the stroke ladder 2, 2.5, 3 and 4 CSS px.

The escapement moves, in slow motion at one beat per second (PLAN.md,
Decision 2). Every animated attribute also has a static value equal to its
first frame, so a renderer without SMIL shows frame 0.
"""
import argparse, math, pathlib

W, H = 980, 552
LINE, FRAME, DETAIL, KNOCK = "#143C6B", "#736A60", "#2A2520", "#D3DCE3"

# ---- timing -------------------------------------------------------------------
PERIOD = 2.0          # s, one full swing of the balance: two beats
AMPLITUDE = 150.0     # degrees each way from centre
PIN_ARC = 25.0        # the fork moves while the balance is within this of centre
BANK = 9.0            # degrees: the fork's swing each side of its centre line
FOURTH_LOOP = 60.0    # s: the fourth wheel carries the seconds hand, one turn a minute

# ---- wheels: teeth, pitch radius, spokes ---------------------------------------
# Each wheel's teeth mesh with the pinion on the next arbor. A wheel and the
# pinion it drives share one tooth pitch, so the pinion's radius follows from
# its leaves, and the ratio of teeth to leaves is the ratio of their speeds:
#   barrel 36 / centre pinion 6   centre 32 / third pinion 4 = 8
#   third 30 / fourth pinion 4 = 7.5   fourth 14 / escape pinion 7 = 2
# A real pinion rarely has fewer than 6 leaves; 4 keeps the centre and third
# wheels' teeth coarse enough to read (user, 2026-09-24).
# 8 and 7.5 are a real watch's ratios, so the centre wheel and the minute hand
# on its arbor turn once an hour. 2 is not (a real one is about 10); it keeps
# the fourth wheel's tick at a visible 6 degrees (user, 2026-09-24).
BARREL = dict(teeth=36, rp=74, leaves=None)
CENTRE = dict(teeth=32, rp=50, spokes=5, leaves=6)
THIRD = dict(teeth=30, rp=44, spokes=4, leaves=4)
FOURTH = dict(teeth=14, rp=28, spokes=4, leaves=4)
ESCAPE = dict(teeth=15, rp=27, spokes=5, leaves=7)
HOUR_RATIO = 12       # the motion works under the dial turn the hour hand
BALANCE_R = 56

# ---- the case, in px from the watch centre ---------------------------------------
R_CASE, R_BEZEL = 250, 228          # case edge; the bezel is the chapter ring's outside
R_RING = 192                        # chapter ring inside


def n(x):
    """A coordinate for the file: one decimal, no '-0', no trailing zeros."""
    s = f"{x:.1f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def pt(r, a, o=(0.0, 0.0)):
    """Polar to xy, from origin `o`. `a` is in degrees on screen: 0 = 3 o'clock,
    increasing clockwise, because the y axis points down."""
    t = math.radians(a)
    return o[0] + r * math.cos(t), o[1] + r * math.sin(t)


def xy(p):
    return f"{n(p[0])} {n(p[1])}"


def clock(c):
    """A clock-face angle (0 = 12 o'clock, clockwise) as a screen angle."""
    return c - 90


def angle(a, b):
    return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


def attrs(a):
    return " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in a.items() if v is not None)


def el(tag, **a):
    return f"<{tag} {attrs(a)}/>"


def wrap(tag, body, **a):
    return f"<{tag} {attrs(a)}>\n" + "\n".join(body) + f"\n</{tag}>"


def circle(c, r, **a):
    return el("circle", cx=n(c[0]), cy=n(c[1]), r=n(r), **a)


# ---- shapes ---------------------------------------------------------------------
def gear(teeth, rp, phase=0.0, add=4, ded=4, w_root=0.56, w_tip=0.30):
    """The closed outline of a toothed wheel, centred on 0,0."""
    p = 360.0 / teeth
    rr, rt = rp - ded, rp + add
    d = []
    for i in range(teeth):
        c = phase + i * p
        if i == 0:
            d.append("M" + xy(pt(rr, c - w_root * p / 2)))
        d.append("L" + xy(pt(rt, c - w_tip * p / 2)))
        d.append(f"A{n(rt)} {n(rt)} 0 0 1 " + xy(pt(rt, c + w_tip * p / 2)))
        d.append("L" + xy(pt(rr, c + w_root * p / 2)))
        d.append(f"A{n(rr)} {n(rr)} 0 0 1 " + xy(pt(rr, c + p - w_root * p / 2)))
    return "".join(d) + "Z"


def escape_outline(teeth, rr, rt, phase=0.0):
    """A lever escape wheel: club teeth whose locking face leads anticlockwise,
    the way this one turns."""
    p = -360.0 / teeth
    d = []
    for i in range(teeth):
        c = phase + i * p
        if i == 0:
            d.append("M" + xy(pt(rr, c - 0.9 * p)))
        # the back of the tooth curves up to the club; the club's flat top is
        # the impulse face; the locking face drops almost radially
        d.append("Q" + xy(pt(rr + 2, c - 0.55 * p)) + " " + xy(pt(rt - 2, c - 0.22 * p)))
        d.append("L" + xy(pt(rt, c)))
        d.append("L" + xy(pt(rr, c + 0.04 * p)))
        d.append(f"A{n(rr)} {n(rr)} 0 0 0 " + xy(pt(rr, c + 0.1 * p)))
    return "".join(d) + "Z"


def openings(spokes, r_hub, r_rim, spoke_w, phase=0.0):
    """The gaps between straight spokes of constant width, one subpath each."""
    h = spoke_w / 2

    def edge(s, side, r):
        along = math.sqrt(r * r - h * h)
        t = math.radians(s)
        return (along * math.cos(t) - side * h * math.sin(t),
                along * math.sin(t) + side * h * math.cos(t))

    d = []
    for k in range(spokes):
        s0 = phase + k * 360.0 / spokes
        s1 = s0 + 360.0 / spokes
        d.append("M" + xy(edge(s0, +1, r_rim))
                 + f"A{n(r_rim)} {n(r_rim)} 0 0 1 " + xy(edge(s1, -1, r_rim))
                 + "L" + xy(edge(s1, -1, r_hub))
                 + f"A{n(r_hub)} {n(r_hub)} 0 0 0 " + xy(edge(s0, +1, r_hub)) + "Z")
    return "".join(d)


def disc(r):
    return f"M{n(r)} 0A{n(r)} {n(r)} 0 1 1 {n(-r)} 0A{n(r)} {n(r)} 0 1 1 {n(r)} 0Z"


def ring(r_out, r_in):
    """An annulus as one path, for fill-rule evenodd."""
    return disc(r_out) + disc(r_in)


def spiral(r_in, r_out, a_in, a_out, segments):
    """An Archimedean spiral from (r_in, a_in) to (r_out, a_out), angles in
    degrees, as cubic Beziers. The same `segments` always gives the same
    commands, so two spirals can be frames of one <animate>."""
    a_in, a_out = math.radians(a_in), math.radians(a_out)
    sweep, dr = a_out - a_in, r_out - r_in

    def point(s):
        r, a = r_in + s * dr, a_in + s * sweep
        return ((r * math.cos(a), r * math.sin(a)),
                (dr * math.cos(a) - r * sweep * math.sin(a),
                 dr * math.sin(a) + r * sweep * math.cos(a)))

    p0, d0 = point(0.0)
    out = ["M" + xy(p0)]
    k = 1.0 / segments / 3
    for i in range(1, segments + 1):
        p1, d1 = point(i / segments)
        out.append("C" + xy((p0[0] + d0[0] * k, p0[1] + d0[1] * k)) + " "
                   + xy((p1[0] - d1[0] * k, p1[1] - d1[1] * k)) + " " + xy(p1))
        p0, d0 = p1, d1
    return "".join(out)


def band(points, width, samples=12):
    """A bridge: a closed outline `width` wide around a smooth centre line
    through `points` (Catmull-Rom), with round ends."""
    pts = [points[0]] + list(points) + [points[-1]]
    line = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for j in range(samples):
            t = j / samples
            line.append(tuple(
                0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t
                       + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t
                       + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t ** 3)
                for k in (0, 1)))
    line.append(points[-1])
    h = width / 2
    left, right = [], []
    for i, p in enumerate(line):
        a, b = line[max(i - 1, 0)], line[min(i + 1, len(line) - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        left.append((p[0] - dy / L * h, p[1] + dx / L * h))
        right.append((p[0] + dy / L * h, p[1] - dx / L * h))
    d = "M" + xy(left[0]) + "".join("L" + xy(q) for q in left[1:])
    d += f"A{n(h)} {n(h)} 0 0 0 " + xy(right[-1])
    d += "".join("L" + xy(q) for q in reversed(right[:-1]))
    d += f"A{n(h)} {n(h)} 0 0 0 " + xy(left[0]) + "Z"
    return d


def pitch(w):
    """The arc between two teeth, on the pitch circle."""
    return 2 * math.pi * w["rp"] / w["teeth"]


def depth(w):
    """Addendum and dedendum: 4 px, or less where the teeth are fine."""
    return min(4.0, 0.32 * pitch(w))


def wheel(w, phase=0.0, rim=6, hub=12, spoke_w=6, outline=None, ded=None):
    """A wheel with crossings: its lit face, the toothed outline, the openings."""
    ded = depth(w) if ded is None else ded
    outline = outline or gear(w["teeth"], w["rp"], phase, ded, ded)
    holes = openings(w["spokes"], hub, w["rp"] - ded - rim, spoke_w, phase + 90 / w["spokes"])
    fine = pitch(w) < 9                    # fine teeth take the thinner line
    return [el("path", d=outline + holes, fill=KNOCK, fill_rule="evenodd"),
            el("path", d=outline, fill="none", stroke=LINE, stroke_width="2" if fine else "2.5",
               stroke_linejoin="round"),
            el("path", d=holes, fill="none", stroke=LINE, stroke_width="2", stroke_linejoin="round"),
            circle((0, 0), 4, fill=KNOCK, stroke=LINE, stroke_width="2")]


def pinion(leaves, r, phase):
    """A pinion: few, rounded leaves, at the pitch of the wheel that drives it."""
    p = 2 * math.pi * r / leaves
    return [el("path", d=gear(leaves, r, phase, min(3.5, 0.3 * p), min(4.5, 0.42 * p), 0.5, 0.4),
               fill=KNOCK, stroke=LINE, stroke_width="2", stroke_linejoin="round"),
            circle((0, 0), 3, fill=KNOCK, stroke=LINE, stroke_width="2")]


def dagger(length, w_max, at, tail, w_tail, stroke_w, turn=0.0, neck=None):
    """A hand pointing at 12 from 0,0, turned `turn` degrees: widest at
    `at` of its length, with a short tail. A face in the frame colour, as
    sundial.svg's wall, with a deep-blue outline. With `neck`, the hand
    narrows to `w_tail` that far from the arbor, so it hides little there."""
    side = [(w_max / 2, -length * at)] + ([(w_tail / 2, -neck)] if neck else []) + [(w_tail / 2, tail)]
    pts = [(0, -length)] + side + [(-x, y) for x, y in reversed(side)]
    d = "M" + "L".join(f"{n(x)} {n(y)}" for x, y in pts) + "Z"
    return el("path", d=d, fill=FRAME, stroke=LINE, stroke_width=stroke_w, stroke_linejoin="round",
              transform=f"rotate({n(turn)})" if turn else None)


# ---- motion -------------------------------------------------------------------------
def balance_angle(t):
    """Degrees, clockwise, at time t. At the end of its swing at t = 0."""
    return AMPLITUDE * math.cos(2 * math.pi * t / PERIOD)


def tick_window():
    """The two parts of a period, as fractions, when the impulse pin drives
    the fork: the balance is within PIN_ARC of centre."""
    u = math.acos(PIN_ARC / AMPLITUDE) / (2 * math.pi)
    v = math.acos(-PIN_ARC / AMPLITUDE) / (2 * math.pi)
    return [(u, v), (1 - v, 1 - u)]


def stepper(dur, step):
    """keyTimes and values for a part that turns `step` degrees at each beat
    and holds still between beats, over `dur` seconds."""
    periods = dur / PERIOD
    times, values, a = [0.0], [0.0], 0.0
    for k in range(round(periods)):
        for (u, v) in tick_window():
            times += [(k + u) / periods, (k + v) / periods]
            values += [a, a + step]
            a += step
    return times + [1.0], values + [a]


def rotor(dur, times, values, accumulate=False):
    """With `accumulate`, each repeat starts where the last one ended, so one
    period of keyframes turns a slow wheel for ever (Chromium and Firefox)."""
    kt = ";".join(f"{t:.4f}".rstrip("0").rstrip(".") if t else "0" for t in times)
    fine = lambda v: f"{v:.4f}".rstrip("0").rstrip(".") if v else "0"
    return el("animateTransform", attributeName="transform", type="rotate",
              values=";".join(fine(v) for v in values), keyTimes=kt,
              dur=f"{dur:g}s", repeatCount="indefinite",
              accumulate="sum" if accumulate else None)


def turning(centre, body, dur, times, values, accumulate=False):
    """`body` drawn about 0,0, moved to `centre`, turning as `values` say.
    The static transform is the first frame."""
    inner = wrap("g", [rotor(dur, times, values, accumulate)] + body,
                 transform=f"rotate({n(values[0])})" if values[0] else None)
    return wrap("g", [inner], transform=f"translate({xy(centre)})")


def hole(name, c, r):
    """A clipPath that keeps everything except the disc (c, r): the part of a
    lower wheel that the wheel above it covers. Ids carry the drawing's name,
    so copies of it on one page do not collide."""
    d = (f"M-400 -400H400V400H-400ZM{n(c[0] + r)} {n(c[1])}"
         f"A{n(r)} {n(r)} 0 1 1 {n(c[0] - r)} {n(c[1])}A{n(r)} {n(r)} 0 1 1 {n(c[0] + r)} {n(c[1])}Z")
    return f'<clipPath id="skeleton-watch-under-{name}">' + el("path", d=d, clip_rule="evenodd") + "</clipPath>"


def under(names, body):
    """`body`, clipped by each named hole in turn."""
    for name in names:
        body = [wrap("g", body, clip_path=f"url(#skeleton-watch-under-{name})")]
    return body[0]


# ---- the drawing ------------------------------------------------------------------------
def build(wx, wy):
    C = (0.0, 0.0)
    # a pinion's radius: its leaves at the pitch of the wheel that drives it
    r_pin = lambda driver, driven: driven["leaves"] * driver["rp"] / driver["teeth"]
    BRL = pt(BARREL["rp"] + r_pin(BARREL, CENTRE), clock(0))
    T = pt(CENTRE["rp"] + r_pin(CENTRE, THIRD), 5)
    F = pt(THIRD["rp"] + r_pin(THIRD, FOURTH), 85, T)
    E = pt(FOURTH["rp"] + r_pin(FOURTH, ESCAPE), 140, F)
    LEVER = 185.0                                   # from the escape wheel toward the balance
    P = pt(36, LEVER, E)                            # the fork's pivot
    BAL = pt(100, LEVER, E)
    MOUTH = math.dist(P, BAL) - 12                  # pivot to the fork's mouth
    # Back to front: escape wheel, fourth, third, centre, barrel. Each wheel's
    # teeth lie over the pinion they drive, so every mesh is in view. A lower
    # wheel is hidden inside the root circle of each wheel above it (the inside
    # edge of its teeth), so the gaps between teeth stay open.
    train = [("escape", E, ESCAPE, 23, 33), ("fourth", F, FOURTH), ("third", T, THIRD),
             ("centre", C, CENTRE), ("barrel", BRL, BARREL), ("balance", BAL, None, BALANCE_R, BALANCE_R)]
    radii = {k[0]: (k[1], k[3] if len(k) > 3 else k[2]["rp"] - depth(k[2]),
                    k[4] if len(k) > 3 else k[2]["rp"] + depth(k[2])) for k in train}
    above = {}                        # wheel -> the wheels above it that overlap it
    for i, (lo, *_) in enumerate(train):
        above[lo] = [hi for hi, *_ in train[i + 1:]
                     if math.dist(radii[lo][0], radii[hi][0]) < radii[lo][2] + radii[hi][1]]
    g = [wrap("defs", [hole(k, c, r) for k, (c, r, _) in radii.items() if k != "escape"])]

    # ---- strap and lugs: what holds the watch -------------------------------------
    edge = lambda x, s: s * math.sqrt(R_CASE ** 2 - x ** 2)
    for s in (-1, 1):
        far = s * 300
        sweep = lambda x1, x2: 1 if (x2 - x1) * s < 0 else 0   # along the case, outside
        g.append(el("path", d=f"M-84 {n(far)}L-84 {n(edge(84, s))}A{R_CASE} {R_CASE} 0 0 {sweep(-84, 84)} "
                    f"84 {n(edge(84, s))}L84 {n(far)}Z",
                    fill=FRAME, fill_opacity="0.18", stroke=FRAME, stroke_width="3"))
        for x1, x2 in ((-112, -84), (84, 112)):
            g.append(el("path", d=f"M{x1} {n(far)}L{x1} {n(edge(x1, s))}A{R_CASE} {R_CASE} 0 0 "
                        f"{sweep(x1, x2)} {x2} {n(edge(x2, s))}L{x2} {n(far)}Z",
                        fill=FRAME, fill_opacity="0.18", stroke=FRAME, stroke_width="3",
                        stroke_linejoin="round"))
    g.append(el("rect", x=n(R_CASE - 2), y="-17", width="22", height="34", rx="4",
                fill=FRAME, fill_opacity="0.18", stroke=FRAME, stroke_width="3"))   # the crown

    # ---- the case band -------------------------------------------------------------
    g.append(el("path", d=ring(R_CASE, R_BEZEL), fill=FRAME, fill_opacity="0.18", fill_rule="evenodd"))

    # ---- the train, back to front -------------------------------------------------------
    esc_step = -360.0 / ESCAPE["teeth"] / 2                  # half a tooth a beat, anticlockwise
    step = {"escape": esc_step}
    step["fourth"] = -step["escape"] * ESCAPE["leaves"] / FOURTH["teeth"]     # +6: clockwise
    step["third"] = -step["fourth"] * FOURTH["leaves"] / THIRD["teeth"]
    step["centre"] = -step["third"] * THIRD["leaves"] / CENTRE["teeth"]      # +0.1: once an hour
    step["barrel"] = -step["centre"] * CENTRE["leaves"] / BARREL["teeth"]
    slow = lambda k: stepper(PERIOD, step[k]) + (True,)     # one period, accumulated

    # Phases: at t = 0 each driving wheel has a tooth on the line to the pinion
    # it drives, and that pinion has a gap facing it.
    drives = {"barrel": ("centre", BRL, C), "centre": ("third", C, T), "third": ("fourth", T, F),
              "fourth": ("escape", F, E)}
    def tooth_phase(k):
        return angle(drives[k][1], drives[k][2]) if k in drives else 0.0

    wheels = {"barrel": BARREL, "centre": CENTRE, "third": THIRD, "fourth": FOURTH, "escape": ESCAPE}

    def pinion_of(k, c, w):
        """Arbor k's pinion, with a gap facing the wheel that drives it."""
        driver = next(d for d, (dn, _, _) in drives.items() if dn == k)
        return pinion(w["leaves"], r_pin(wheels[driver], w), angle(c, radii[driver][0]) + 180 / w["leaves"])

    # the escape wheel: its teeth work the fork. It accumulates too: no loop of
    # its own repeats for 15 teeth, 5 spokes and a 7-leaf pinion at once, and a
    # loop that did not showed a jump at each restart.
    g.append(under(above["escape"], [turning(E, wheel(ESCAPE, 0, rim=5, hub=8, spoke_w=5, ded=0,
                                                      outline=escape_outline(ESCAPE["teeth"], 23, 33, 6))
                                             + pinion_of("escape", E, ESCAPE),
                                             PERIOD, *slow("escape"))]))
    # the fourth wheel: 6 degrees a beat, one turn a minute; it carries the seconds hand
    times, values = stepper(FOURTH_LOOP, step["fourth"])
    g.append(under(above["fourth"], [turning(F, wheel(FOURTH, tooth_phase("fourth"), hub=8, rim=5)
                                             + pinion_of("fourth", F, FOURTH),
                                             FOURTH_LOOP, times, values)]))
    g.append(under(above["third"], [turning(T, wheel(THIRD, tooth_phase("third"))
                                            + pinion_of("third", T, THIRD), PERIOD, *slow("third"))]))
    g.append(under(above["centre"], [turning(C, wheel(CENTRE, tooth_phase("centre"), hub=14, spoke_w=7)
                                             + pinion_of("centre", C, CENTRE), PERIOD, *slow("centre"))]))
    # the barrel, in front: its lid is cut away to show the mainspring
    outline = gear(BARREL["teeth"], BARREL["rp"], tooth_phase("barrel"))
    g.append(under(above["barrel"], [turning(BRL, [
        el("path", d=outline + disc(BARREL["rp"] - 12), fill=KNOCK, fill_rule="evenodd"),
        el("path", d=outline, fill="none", stroke=LINE, stroke_width="2.5", stroke_linejoin="round"),
        circle(C, BARREL["rp"] - 12, fill="none", stroke=LINE, stroke_width="2"),
        el("path", d=spiral(19, BARREL["rp"] - 16, 150, 150 + 360 * 3.5, 14), fill="none",
           stroke=LINE, stroke_width="2", stroke_linecap="round"),
        circle(C, 15, fill=KNOCK, stroke=LINE, stroke_width="3"),
    ], PERIOD, *slow("barrel"))]))

    # ---- the balance and its hairspring ---------------------------------------------
    frames = [i / 24 * PERIOD for i in range(25)]
    b_times = [i / 24 for i in range(25)]
    b_values = [balance_angle(t) for t in frames]
    pin_dir = angle(BAL, P)                         # the impulse pin faces the fork at rest
    bal = [el("path", d=ring(BALANCE_R, BALANCE_R - 8), fill=KNOCK, fill_rule="evenodd",
              stroke=LINE, stroke_width="3")]
    for k in range(3):
        a = pin_dir + 60 + 120 * k
        s, c = math.sin(math.radians(a)), math.cos(math.radians(a))
        q = [(r * c + side * 3 * s, r * s - side * 3 * c) for r, side in
             ((9, 1), (BALANCE_R - 8, 1), (BALANCE_R - 8, -1), (9, -1))]
        bal.append(el("path", d="M" + "L".join(xy(p) for p in q) + "Z", fill=KNOCK,
                      stroke=LINE, stroke_width="2", stroke_linejoin="round"))
    bal += [circle(C, 10, fill=KNOCK, stroke=LINE, stroke_width="2"),
            circle(pt(12, pin_dir), 3, fill=LINE)]
    stud = angle(BAL, C) + 150                       # where the spring's outer end is held
    springs = [spiral(8, 38, stud - 360 * 3.25 + a, stud, 13) for a in b_values]
    spring = (f'<path d="{springs[0]}" fill="none" stroke="{LINE}" stroke-width="2" '
              f'stroke-linecap="round">' + el("animate", attributeName="d", values=";".join(springs),
                                                keyTimes=";".join(f"{t:.4f}".rstrip("0").rstrip(".") or "0"
                                                                  for t in b_times),
                                                dur=f"{PERIOD:g}s", repeatCount="indefinite") + "</path>")
    g.append(turning(BAL, bal, PERIOD, b_times, b_values))
    g.append(wrap("g", [spring], transform=f"translate({xy(BAL)})"))

    # ---- the pallet fork: flips at each beat -----------------------------------------
    (u0, v0), (u1, v1) = tick_window()
    ftimes = [0, u0, v0, u1, v1, 1]
    fvalues = [-BANK, -BANK, BANK, BANK, -BANK, -BANK]
    L = MOUTH
    shape = [(L - 9, 3), (L + 2, 7.5), (L + 3.5, 4.5), (L - 2, 2.2), (L - 2, -2.2), (L + 3.5, -4.5),
             (L + 2, -7.5), (L - 9, -3), (6, -4.5), (1, -21), (-9, -23), (-15, -19), (-13, -15),
             (-6, -13), (-5, 0), (-6, 13), (-13, 15), (-15, 19), (-9, 23), (1, 21), (6, 4.5)]
    a = math.radians(angle(P, BAL))
    ca, sa = math.cos(a), math.sin(a)
    fork = "M" + "L".join(xy((u * ca - v * sa, u * sa + v * ca)) for u, v in shape) + "Z"
    g.append(turning(P, [el("path", d=fork, fill=KNOCK, stroke=LINE, stroke_width="2.5",
                            stroke_linejoin="round"),
                         circle(C, 4, fill=KNOCK, stroke=LINE, stroke_width="2")], PERIOD, ftimes, fvalues))

    # ---- the seconds hand, on the fourth wheel's arbor --------------------------------
    times, values = stepper(FOURTH_LOOP, 6.0)
    # a small pivot, not a cap, so the fourth pinion's mesh stays in view
    seconds = [dagger(60, 9, 0.70, 6, 2, "2", neck=16), circle(C, 2.5, fill=LINE)]
    g.append(turning(F, seconds, FOURTH_LOOP, times, values))

    # ---- the chapter ring: what is left of the dial ------------------------------------
    g.append(el("path", d=ring(R_BEZEL, R_RING), fill=KNOCK, fill_rule="evenodd"))
    g.append(circle(C, R_RING, fill="none", stroke=FRAME, stroke_width="2"))
    ticks = "".join(f"M{xy(pt(214, clock(m * 6)))}L{xy(pt(221, clock(m * 6)))}"
                    for m in range(60) if m % 5)
    g.append(el("path", d=ticks, stroke=DETAIL, stroke_opacity="0.5", stroke_width="2",
                stroke_linecap="round"))
    hours = "".join(f"M{xy(pt(200, clock(h * 30)))}L{xy(pt(220, clock(h * 30)))}" for h in range(12))
    g.append(el("path", d=hours, stroke=LINE, stroke_width="4", stroke_linecap="round"))

    # ---- the case edge and the bezel ----------------------------------------------------
    g.append(circle(C, R_CASE, fill="none", stroke=FRAME, stroke_width="4"))
    g.append(circle(C, R_BEZEL, fill="none", stroke=FRAME, stroke_width="3"))

    # ---- the hands, at ten past ten ----------------------------------------------------
    g.append(turning(C, [dagger(140, 17, 0.62, 10, 3, "3", (10 + 9 / 60) * 30, neck=26)],
                     PERIOD, *(stepper(PERIOD, step["centre"] / HOUR_RATIO) + (True,))))
    g.append(turning(C, [dagger(206, 13, 0.70, 12, 3, "3", 9 * 6, neck=26)], PERIOD, *slow("centre")))
    # a small pivot, not a cap, so the barrel's mesh with the centre pinion shows
    g.append(circle(C, 3.5, fill=KNOCK, stroke=LINE, stroke_width="2"))

    return (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">\n'
            f'<g transform="translate({n(wx)} {n(wy)})">\n' + "\n".join(g) + "\n</g>\n</svg>\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out", nargs="?", default=str(pathlib.Path(__file__).parent / "out/skeleton-watch.svg"))
    ap.add_argument("--at", nargs=2, type=float, default=(798, 276), metavar=("X", "Y"))
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(build(*a.at))
    print(f"wrote {out} ({out.stat().st_size / 1024:.1f} KiB)")


if __name__ == "__main__":
    main()
