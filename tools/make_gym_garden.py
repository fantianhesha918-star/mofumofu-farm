"""ジムの まわりの にわ(はなだん・かざり みち・うえき・きの・いけがき・フェンス)を Blender で つくる。
使い方: blender -b -P tools/make_gym_garden.py -- docs/assets/gym
ざひょうは gym_entrance と おなじ(まえが -Y=ゲームの +Z)。ちめんが z=0(ground=False)。ゲームでは gym_entrance と おなじ いちに、おなじ ばいりつ(1.05)で おく。
"""
import bpy, sys, math, random
sys.path.insert(0, __file__.rsplit('tools', 1)[0] + 'tools')
import blib as B

out = sys.argv[sys.argv.index('--') + 1]
random.seed(5)

B.start(out)
GREENS = ['#6cc35c', '#7fcf6a', '#93dc78', '#5cb852']
PETALS = ['#ffb8d4', '#fff0a0', '#ffffff', '#d8c8ff', '#ff9a9a', '#ffd0a0']

def bush(x, y, r, berries=False):   # まるい しげみ(いくつかの たまを かさねる)
    for k in range(4):
        a = k / 4 * 6.2832 + random.uniform(0, 1); rr = r * 0.45 if k else 0.0
        B.sph(r * random.uniform(0.62, 0.8), x + math.cos(a) * rr, y + math.sin(a) * rr, r * 0.7 + random.uniform(0, 0.15) * r, random.choice(GREENS), scale=(1, 1, 0.85), seg=8, ring=5, noise_amt=0.05, freq=2.5)
    if berries:
        for k in range(6):
            a = random.uniform(0, 6.28); d = random.uniform(0.3, 0.8) * r; B.sph(0.09, x + math.cos(a) * d, y + math.sin(a) * d, r * random.uniform(0.9, 1.25), random.choice(['#ff7a8a', '#ffe27a', '#ffffff']), seg=6, ring=4, noise_amt=0.0)

def flower(x, y, h, col):
    B.cyl(0.025, h, x, y, h / 2, '#5cb852', seg=4, noise_amt=0.0)
    B.sph(0.16, x, y, h + 0.03, col, scale=(1, 1, 0.65), seg=6, ring=4, noise_amt=0.0)
    B.sph(0.07, x, y, h + 0.12, '#ffd23a', seg=5, ring=3, noise_amt=0.0)
    if random.random() < 0.5:
        B.sph(0.09, x + 0.09, y, h * 0.55, '#7fcf6a', scale=(1.6, 0.8, 0.5), seg=5, ring=3, noise_amt=0.0)

def tree(x, y, s=1.0, blossom=False):
    B.cyl(0.28 * s, 1.5 * s, x, y, 0.75 * s, '#b98a5c', seg=8, r2=0.2 * s, noise_amt=0.06, smooth=True)
    cols = ['#ffc4dc', '#ffd6e8', '#ffb0cc', '#ffe0ee'] if blossom else GREENS
    for k in range(5):
        a = k / 5 * 6.2832; rr = 0.8 * s if k else 0.0
        B.sph(1.05 * s * random.uniform(0.85, 1.05), x + math.cos(a) * rr, y + math.sin(a) * rr, (2.2 + (0.3 if k == 0 else 0.0) + random.uniform(-0.1, 0.2)) * s, random.choice(cols), scale=(1, 1, 0.88), seg=10, ring=7, noise_amt=0.05, freq=1.8)
    for k in range(8 if not blossom else 14):
        a = random.uniform(0, 6.28); d = random.uniform(0.4, 1.5) * s
        B.sph(0.1 * s, x + math.cos(a) * d, y + math.sin(a) * d, random.uniform(1.9, 3.2) * s, random.choice(['#ff7a8a', '#ffe27a', '#ffffff'] if not blossom else ['#ffffff', '#ffe0ee']), seg=6, ring=4, noise_amt=0.0)
    B.rock(0.5 * s, x + 0.5 * s, y - 0.4 * s, 0.1, '#bdb8c8', scale=(1, 1, 0.6), rough=0.15, sub=1, seed=int(x * 7 + y), noise_amt=0.05, moss=('#86cf74', 0.4))   # ねもとの いし

def lantern(x, y):
    B.cyl(0.4, 0.22, x, y, 0.11, '#d4cebf', seg=10, noise_amt=0.03); B.cyl(0.16, 0.9, x, y, 0.65, '#e0dacb', seg=10, noise_amt=0.03, smooth=True)
    B.rbox(0.7, 0.7, 0.55, x, y, 1.35, '#ece6d4', bev=0.1, bseg=3, noise_amt=0.03); B.sph(0.2, x, y, 1.35, '#ffe9a0', seg=10, ring=8, noise_amt=0.0, glow=0.4)
    B.cyl(0.62, 0.16, x, y, 1.75, '#d4cebf', seg=10, r2=0.1, noise_amt=0.03); B.sph(0.1, x, y, 2.05, '#ffd45a', seg=8, ring=6, noise_amt=0.0, glow=0.1)

def mushrooms(x, y):
    for k in range(3):
        sz = random.uniform(0.18, 0.34); xx = x + random.uniform(-0.4, 0.4); yy = y + random.uniform(-0.4, 0.4); cc = random.choice(['#ff9ac0', '#ffe08a', '#ff8a7a'])
        B.cyl(sz * 0.2, sz, xx, yy, sz / 2, '#fff2e0', seg=6, noise_amt=0.0)
        B.sph(sz * 0.7, xx, yy, sz, cc, scale=(1, 1, 0.65), seg=8, ring=6, noise_amt=0.0)
        B.sph(sz * 0.12, xx + sz * 0.2, yy, sz + sz * 0.35, '#ffffff', seg=5, ring=3, noise_amt=0.0)

def bed(x0, x1, y0, y1):   # はなだん(いしの ふち・つち・はな)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; w, d = x1 - x0, y1 - y0
    B.rbox(w + 0.5, d + 0.5, 0.55, cx, cy, -0.05, '#e8dcc0', bev=0.2, bseg=3, noise_amt=0.04)
    B.rbox(w, d, 0.5, cx, cy, 0.12, '#8a6244', bev=0.15, bseg=3, noise_amt=0.1)
    n = int(w * d * 5.0)
    for k in range(n):
        flower(random.uniform(x0 + 0.25, x1 - 0.25), random.uniform(y0 + 0.25, y1 - 0.25), random.uniform(0.35, 0.8), random.choice(PETALS))
    for k in range(4):
        B.sph(random.uniform(0.18, 0.28), random.uniform(x0 + 0.3, x1 - 0.3), random.uniform(y0 + 0.3, y1 - 0.3), 0.4, random.choice(GREENS), scale=(1, 1, 0.7), seg=8, ring=6, noise_amt=0.04)

# ---- かざり みち(まえに のびる) ----
for k in range(9):
    y = -3.6 - k * 1.35
    for j in (-0.8, 0.8):
        B.rbox(1.4 + random.uniform(-0.1, 0.1), 1.2, 0.2, j + random.uniform(-0.15, 0.15), y + random.uniform(-0.1, 0.1), 0.04, '#eadfc4', bev=0.18, bseg=3, rot=(0, 0, random.uniform(-0.08, 0.08)), noise_amt=0.05)
for k in range(30):   # みちの ふちの こいし・くさ
    s = random.choice((-1, 1)); B.sph(random.uniform(0.07, 0.14), s * random.uniform(1.8, 2.2), random.uniform(-14.5, -3.4), 0.06, '#cfc4a8', scale=(1, 1, 0.6), seg=6, ring=4, noise_amt=0.05)
for s in (-1, 1):
    for k in range(3):
        lantern(s * 2.7, -5.2 - k * 3.8)

# ---- はなだん ----
bed(3.6, 6.4, -6.2, -3.7)
bed(-6.4, -3.6, -6.2, -3.7)
bed(3.6, 6.4, -11.2, -7.7)
bed(-6.4, -3.6, -11.2, -7.7)
for s in (-1, 1):
    for k in range(4):   # みちの よこの しげみ
        bush(s * 2.0, -4.6 - k * 2.9, 0.55 + random.uniform(0, 0.12))

# ---- たてものの よこ・うしろの しげみ ----
for s in (-1, 1):
    for k in range(7):
        y = -2.5 + k * 2.0
        bush(s * 9.6, y, 0.85 + (k % 2) * 0.15, berries=(k % 3 == 0))
for k in range(9):
    bush(-8.0 + k * 2.0, 10.4, 0.8 + (k % 2) * 0.12, berries=(k % 3 == 1))

# ---- うえき・きの ----
for (x, y, s, bl) in [(-12.0, -5.5, 1.1, True), (12.0, -5.5, 1.1, True), (-13.4, 1.5, 1.2, False), (13.4, 1.5, 1.2, False), (-12.2, 8.0, 1.0, True), (12.2, 8.0, 1.0, True), (-9.0, -13.5, 0.9, False), (9.0, -13.5, 0.9, False), (-14.0, -10.5, 1.0, False), (14.0, -10.5, 1.0, False)]:
    tree(x, y, s, bl)
for (x, y) in [(-11.0, -3.0), (11.0, -3.0), (-11.8, 6.0), (11.8, 6.0), (-8.0, -12.0), (8.0, -12.0), (-12.5, -8.5), (12.5, -8.5)]:
    mushrooms(x, y)

# ---- ひろい しばふ に ちらばる はな・くさの むら ----
for k in range(45):
    a = random.uniform(0, 6.28); r = random.uniform(8.5, 15.5)
    x, y = math.cos(a) * r * 1.2, -2.0 + math.sin(a) * r * 0.9
    if abs(x) < 3.2 and y < -2.0: continue
    if abs(x) < 8.6 and -3.5 < y < 11: continue
    flower(x, y, random.uniform(0.3, 0.6), random.choice(PETALS))
for k in range(14):   # くさむら
    a = random.uniform(0, 6.28); r = random.uniform(8.0, 14.5); x, y = math.cos(a) * r * 1.2, -2.0 + math.sin(a) * r * 0.9
    if abs(x) < 3.5 and y < -2.0: continue
    for j in range(5):
        B.leaf(random.uniform(0.5, 0.9), 0.14, x + random.uniform(-0.25, 0.25), y + random.uniform(-0.25, 0.25), 0.0, random.choice(GREENS), rot=(-1.1 + random.uniform(-0.25, 0.25), 0, random.uniform(0, 6.28)), bend=0.5, noise_amt=0.04)

# ---- しろい フェンス(まえの そとがわ) ----
for s in (-1, 1):
    for k in range(5):
        x = s * (6.4 + k * 1.6)
        B.rbox(0.14, 0.14, 0.9, x, -15.2, 0.45, '#fffaf0', bev=0.05, bseg=2, noise_amt=0.02)
        B.sph(0.11, x, -15.2, 0.95, '#fffaf0', seg=8, ring=6, noise_amt=0.0)
        if k < 4:
            for z in (0.3, 0.65):
                B.rbox(1.6, 0.07, 0.08, x + s * 0.8, -15.2, z, '#fffaf0', bev=0.02, bseg=2, noise_amt=0.02)

B.build('gym_garden', ground=False)
