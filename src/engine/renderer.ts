import { resources } from './resources';
import type { Vec2 } from './math';
import { clamp, vec2Lerp } from './math';

interface ProceduralInfo {
  time: number;
  seed: number;
  key: string;
  variant: number;
  kind: 'ground' | 'feature' | 'entity' | 'ui';
}

type ProceduralDrawer = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  info: ProceduralInfo
) => void;

const getTimeSeconds = (): number =>
  (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
};

const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const createGroundDrawer = (
  base: string,
  highlight: string,
  shadow: string,
  accent: string
): ProceduralDrawer => (ctx, w, h, info) => {
  ctx.save();
  const gradient = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  const shimmer = Math.sin(info.time * 0.4 + info.seed * 6) * 0.15;
  gradient.addColorStop(0, shadow);
  gradient.addColorStop(0.5 + shimmer * 0.2, base);
  gradient.addColorStop(1, highlight);
  ctx.fillStyle = gradient;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  const rand = seededRandom(Math.floor(info.seed * 65535));
  const speckles = 6 + Math.floor(rand() * 6);
  for (let i = 0; i < speckles; i += 1) {
    const px = rand() * w - w / 2;
    const py = rand() * h - h / 2;
    const radius = (0.05 + rand() * 0.12) * w;
    const alpha = 0.1 + rand() * 0.15;
    ctx.beginPath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = accent;
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = shadow;
  ctx.fillRect(-w / 2, h * 0.15, w, h * 0.2);

  ctx.globalAlpha = 0.4;
  ctx.fillStyle = highlight;
  ctx.fillRect(-w / 2, -h * 0.4, w, h * 0.25);
  ctx.restore();
};

const COLOR_PALETTE: Record<string, string> = {
  'ground:1': '#5fbc6d', // meadow
  'ground:2': '#f2d082', // sandy beach
  'ground:3': '#2676d1', // deep sea
  'ground:4': '#8d6e63', // mountains
  'ground:5': '#d84315', // volcanic crust
  'ground:6': '#3f8c46', // dense forest floor
  'ground:7': '#70c4e8', // lakes
  'ground:8': '#bfa177', // cobblestone town
  'ground:9': '#6a4c93', // enchanted glade
  'ground:10': '#cfd8dc', // snowy peaks
  'features:1': '#2e7d32',
  'features:2': '#ffab40',
  'features:3': '#6d4c41',
  'features:4': '#ff7043',
  'features:5': '#607d8b',
  'features:6': '#0097a7',
  'features:7': '#c0ca33',
  player: '#f5f5f5',
  'npc:traveler': '#ff8f00',
  'npc:scholar': '#4fc3f7',
  'npc:ranger': '#81c784',
  'npc:oracle': '#ce93d8'
};

const createTreeDrawer = (leafColor: string): ProceduralDrawer => (ctx, w, h, info) => {
  ctx.save();
  const sway = Math.sin(info.time * 1.6 + info.seed * 10) * w * 0.08;
  ctx.translate(sway, 0);
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(-w * 0.09, h * 0.05, w * 0.18, h * 0.45);
  ctx.beginPath();
  ctx.fillStyle = '#2f1b0f';
  ctx.globalAlpha = 0.35;
  ctx.arc(-w * 0.05, h * 0.22, w * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const rand = seededRandom(Math.floor(info.seed * 12345));
  const canopyOffset = Math.sin(info.time * 0.8 + info.seed * 3) * w * 0.04;
  const drawLeaf = (cx: number, cy: number, radius: number): void => {
    ctx.save();
    ctx.translate(canopyOffset, 0);
    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
    gradient.addColorStop(0, '#f1ffd0');
    gradient.addColorStop(1, leafColor);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawLeaf(-w * 0.18, -h * 0.05, w * (0.25 + rand() * 0.05));
  drawLeaf(w * 0.18, -h * 0.05, w * (0.25 + rand() * 0.05));
  drawLeaf(0, -h * 0.32, w * (0.32 + rand() * 0.05));
  ctx.restore();
};

interface CharacterStyle {
  cloak: { base: string; highlight: string; shadow: string };
  trim: string;
  accent: string;
  hair: { base: string; highlight: string };
  skin: { base: string; shadow: string };
  accessory?: {
    type: 'staff' | 'satchel' | 'scroll' | 'bow' | 'orb';
    primary: string;
    secondary?: string;
    glow?: string;
  };
  extraDetails?: 'freckles' | 'tattoo' | 'none';
}

const createCharacterDrawer = (style: CharacterStyle): ProceduralDrawer => (ctx, w, h, info) => {
  ctx.save();
  const sway = Math.sin(info.time * 1.6 + info.seed * 6) * w * 0.04;
  const bob = Math.sin(info.time * 2.3 + info.seed * 4) * h * 0.03;
  ctx.translate(sway, bob - h * 0.05);

  const cloakGradient = ctx.createLinearGradient(0, -h * 0.45, 0, h * 0.45);
  cloakGradient.addColorStop(0, style.cloak.highlight);
  cloakGradient.addColorStop(0.45, style.cloak.base);
  cloakGradient.addColorStop(1, style.cloak.shadow);
  ctx.fillStyle = cloakGradient;
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, -h * 0.18);
  ctx.quadraticCurveTo(-w * 0.24, h * 0.35, -w * 0.14, h * 0.45);
  ctx.quadraticCurveTo(0, h * 0.5, w * 0.14, h * 0.45);
  ctx.quadraticCurveTo(w * 0.24, h * 0.35, w * 0.26, -h * 0.18);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = style.cloak.highlight;
  ctx.lineWidth = w * 0.018;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * w * 0.08, -h * 0.1);
    ctx.quadraticCurveTo(i * w * 0.06, h * 0.26, i * w * 0.12, h * 0.38);
    ctx.stroke();
  }
  ctx.restore();

  const tunicGradient = ctx.createLinearGradient(0, -h * 0.3, 0, h * 0.35);
  tunicGradient.addColorStop(0, style.accent);
  tunicGradient.addColorStop(1, style.trim);
  ctx.fillStyle = tunicGradient;
  ctx.fillRect(-w * 0.14, -h * 0.24, w * 0.28, h * 0.52);

  ctx.fillStyle = style.trim;
  ctx.beginPath();
  ctx.moveTo(-w * 0.14, -h * 0.12);
  ctx.lineTo(0, -h * 0.02);
  ctx.lineTo(w * 0.14, -h * 0.12);
  ctx.lineTo(w * 0.12, -h * 0.02);
  ctx.lineTo(-w * 0.12, -h * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-w * 0.16, h * 0.06, w * 0.32, h * 0.08);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(-w * 0.16, h * 0.1, w * 0.32, h * 0.02);

  const sleeveGradient = ctx.createLinearGradient(0, -h * 0.1, 0, h * 0.28);
  sleeveGradient.addColorStop(0, style.cloak.highlight);
  sleeveGradient.addColorStop(1, style.cloak.base);
  ctx.fillStyle = sleeveGradient;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, -h * 0.1);
  ctx.quadraticCurveTo(-w * 0.3, h * 0.12, -w * 0.18, h * 0.32);
  ctx.quadraticCurveTo(-w * 0.12, h * 0.18, -w * 0.14, -h * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.22, -h * 0.1);
  ctx.quadraticCurveTo(w * 0.3, h * 0.12, w * 0.18, h * 0.32);
  ctx.quadraticCurveTo(w * 0.12, h * 0.18, w * 0.14, -h * 0.08);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = style.trim;
  ctx.fillRect(-w * 0.21, h * 0.18, w * 0.08, h * 0.07);
  ctx.fillRect(w * 0.13, h * 0.18, w * 0.08, h * 0.07);
  ctx.fillStyle = style.skin.base;
  ctx.beginPath();
  ctx.arc(-w * 0.17, h * 0.25, w * 0.04, 0, Math.PI * 2);
  ctx.arc(w * 0.17, h * 0.25, w * 0.04, 0, Math.PI * 2);
  ctx.fill();

  const bootGradient = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.55);
  bootGradient.addColorStop(0, '#2d2d2d');
  bootGradient.addColorStop(1, '#141414');
  ctx.fillStyle = bootGradient;
  ctx.fillRect(-w * 0.12, h * 0.28, w * 0.08, h * 0.32);
  ctx.fillRect(w * 0.04, h * 0.28, w * 0.08, h * 0.32);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(-w * 0.12, h * 0.28, w * 0.08, h * 0.05);
  ctx.fillRect(w * 0.04, h * 0.28, w * 0.08, h * 0.05);

  ctx.save();
  ctx.translate(0, -h * 0.3);
  const hairGradient = ctx.createLinearGradient(-w * 0.2, -h * 0.12, w * 0.2, h * 0.12);
  hairGradient.addColorStop(0, style.hair.highlight);
  hairGradient.addColorStop(1, style.hair.base);
  ctx.fillStyle = hairGradient;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, 0);
  ctx.quadraticCurveTo(0, -h * 0.22, w * 0.2, 0);
  ctx.quadraticCurveTo(0, h * 0.18, -w * 0.2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-w * 0.14, -h * 0.04, w * 0.28, h * 0.08);

  const faceGradient = ctx.createLinearGradient(0, -h * 0.12, 0, h * 0.16);
  faceGradient.addColorStop(0, style.skin.base);
  faceGradient.addColorStop(1, style.skin.shadow);
  ctx.fillStyle = faceGradient;
  ctx.beginPath();
  ctx.ellipse(0, h * 0.02, w * 0.14, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(-w * 0.06, h * 0.02, w * 0.024, 0, Math.PI * 2);
  ctx.arc(w * 0.06, h * 0.02, w * 0.024, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(-w * 0.05, -h * 0.005, w * 0.01, 0, Math.PI * 2);
  ctx.arc(w * 0.07, -h * 0.005, w * 0.01, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(120, 60, 60, 0.7)';
  ctx.lineWidth = w * 0.015;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.04, h * 0.09);
  ctx.lineTo(w * 0.04, h * 0.09);
  ctx.stroke();

  if (style.extraDetails === 'freckles') {
    ctx.fillStyle = 'rgba(188, 120, 94, 0.7)';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * w * 0.03, h * 0.05, w * 0.008, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style.extraDetails === 'tattoo') {
    ctx.strokeStyle = 'rgba(80, 110, 200, 0.8)';
    ctx.lineWidth = w * 0.01;
    ctx.beginPath();
    ctx.arc(-w * 0.08, h * 0.06, w * 0.05, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  }

  ctx.restore();

  if (style.accessory) {
    ctx.save();
    switch (style.accessory.type) {
      case 'staff': {
        ctx.translate(-w * 0.2, -h * 0.45);
        ctx.rotate(-0.08 + Math.sin(info.time * 1.4 + info.seed * 5) * 0.04);
        ctx.fillStyle = style.accessory.primary;
        ctx.fillRect(-w * 0.015, 0, w * 0.03, h * 0.95);
        ctx.fillStyle = style.accessory.secondary ?? '#ffecb3';
        ctx.beginPath();
        ctx.arc(0, h * 0.9, w * 0.09, 0, Math.PI * 2);
        ctx.fill();
        if (style.accessory.glow) {
          const pulse = 0.6 + Math.sin(info.time * 3 + info.seed) * 0.35;
          ctx.globalAlpha = 0.5 * pulse;
          ctx.fillStyle = style.accessory.glow;
          ctx.beginPath();
          ctx.arc(0, h * 0.9, w * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'satchel': {
        ctx.translate(w * 0.18, h * 0.08);
        ctx.fillStyle = style.accessory.primary;
        ctx.fillRect(-w * 0.12, 0, w * 0.2, h * 0.22);
        ctx.fillStyle = style.accessory.secondary ?? '#4e342e';
        ctx.fillRect(-w * 0.12, h * 0.05, w * 0.2, h * 0.07);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = w * 0.01;
        ctx.beginPath();
        ctx.moveTo(-w * 0.12, 0);
        ctx.lineTo(-w * 0.02, -h * 0.18);
        ctx.moveTo(w * 0.08, 0);
        ctx.lineTo(-w * 0.02, -h * 0.18);
        ctx.stroke();
        break;
      }
      case 'scroll': {
        ctx.translate(w * 0.16, -h * 0.05);
        ctx.rotate(0.12);
        ctx.fillStyle = style.accessory.primary;
        ctx.fillRect(-w * 0.12, -h * 0.02, w * 0.24, h * 0.08);
        ctx.fillStyle = style.accessory.secondary ?? '#d7ccc8';
        ctx.beginPath();
        ctx.arc(-w * 0.12, h * 0.02, w * 0.04, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(w * 0.12, h * 0.02, w * 0.04, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.fill();
        break;
      }
      case 'bow': {
        ctx.translate(-w * 0.2, -h * 0.05);
        ctx.rotate(-0.2);
        ctx.strokeStyle = style.accessory.primary;
        ctx.lineWidth = w * 0.025;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.35);
        ctx.quadraticCurveTo(-w * 0.18, 0, 0, h * 0.35);
        ctx.stroke();
        ctx.strokeStyle = style.accessory.secondary ?? '#cfd8dc';
        ctx.lineWidth = w * 0.01;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.35);
        ctx.lineTo(0, h * 0.35);
        ctx.stroke();
        break;
      }
      case 'orb': {
        ctx.translate(w * 0.2, -h * 0.18);
        const pulse = 0.7 + Math.sin(info.time * 4 + info.seed * 7) * 0.25;
        ctx.fillStyle = style.accessory.primary;
        ctx.beginPath();
        ctx.arc(0, 0, w * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.45 * pulse;
        ctx.fillStyle = style.accessory.glow ?? style.accessory.primary;
        ctx.beginPath();
        ctx.arc(0, 0, w * 0.18 + pulse * w * 0.05, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
    ctx.restore();
  }

  ctx.restore();
};

const PROCEDURAL_DRAWERS: Record<string, ProceduralDrawer> = {
  'ground:1': createGroundDrawer('#64c16e', '#b8f0c1', '#2f5f35', '#dcffd6'),
  'ground:2': createGroundDrawer('#f4d69b', '#fff3d6', '#c49054', '#fff0c2'),
  'ground:3': createGroundDrawer('#1f6dc1', '#7fcef3', '#0b2b4f', '#72dbff'),
  'ground:4': createGroundDrawer('#8d7a6b', '#d6c0aa', '#3e2f26', '#c9b199'),
  'ground:5': createGroundDrawer('#b23a1a', '#ff9c68', '#3b0500', '#ffb28a'),
  'ground:6': createGroundDrawer('#356a3d', '#6dbf73', '#132a18', '#a4d9a8'),
  'ground:7': createGroundDrawer('#3aa9d6', '#a8efff', '#0a4061', '#72d6f8'),
  'ground:8': createGroundDrawer('#b4a282', '#f7e8c6', '#4e3c2a', '#d8c19d'),
  'ground:9': createGroundDrawer('#6f4ea3', '#c6a8ff', '#2a133d', '#f8d8ff'),
  'ground:10': createGroundDrawer('#dbe6f0', '#ffffff', '#7f8c99', '#ffffff'),
  'features:1': createTreeDrawer('#2e7d32'),
  'features:2': (ctx, w, h, info) => {
    ctx.save();
    ctx.fillStyle = '#49311d';
    ctx.fillRect(-w * 0.25, -h * 0.05, w * 0.5, h * 0.55);
    const roofGradient = ctx.createLinearGradient(-w * 0.3, -h * 0.05, w * 0.3, -h * 0.45);
    roofGradient.addColorStop(0, '#ffd9a0');
    roofGradient.addColorStop(1, '#b36b2d');
    ctx.fillStyle = roofGradient;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -h * 0.05);
    ctx.lineTo(0, -h * 0.5 - Math.sin(info.time * 0.5) * h * 0.02);
    ctx.lineTo(w * 0.3, -h * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a1a0d';
    ctx.fillRect(-w * 0.06, h * 0.15, w * 0.12, h * 0.25);
    ctx.restore();
  },
  'features:3': (ctx, w, h, info) => {
    ctx.save();
    const bodyGradient = ctx.createLinearGradient(-w * 0.2, -h * 0.35, w * 0.2, h * 0.45);
    bodyGradient.addColorStop(0, '#57616c');
    bodyGradient.addColorStop(1, '#2a323a');
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(-w * 0.22, -h * 0.35, w * 0.44, h * 0.85);
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(-w * 0.06, -h * 0.25, w * 0.12, h * 0.2);
    ctx.fillRect(-w * 0.06, 0, w * 0.12, h * 0.2);
    ctx.beginPath();
    ctx.fillStyle = '#90a4ae';
    ctx.arc(0, -h * 0.45, w * 0.24, 0, Math.PI, true);
    ctx.fill();
    ctx.restore();
  },
  'features:4': (ctx, w, h, info) => {
    ctx.save();
    ctx.fillStyle = '#5a2d13';
    ctx.fillRect(-w * 0.14, h * 0.05, w * 0.28, h * 0.38);
    const glow = ctx.createRadialGradient(0, -h * 0.1, w * 0.05, 0, -h * 0.1, w * 0.35);
    glow.addColorStop(0, '#ffcf78');
    glow.addColorStop(1, '#8c1a00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, h * 0.05);
    ctx.lineTo(0, -h * 0.5);
    ctx.lineTo(w * 0.3, h * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff9e80';
    ctx.beginPath();
    ctx.arc(0, -h * 0.2, w * 0.2 + Math.sin(info.time) * w * 0.01, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
  'features:5': (ctx, w, h) => {
    ctx.save();
    ctx.fillStyle = '#455a64';
    ctx.beginPath();
    ctx.moveTo(-w * 0.45, h * 0.4);
    ctx.lineTo(0, -h * 0.5);
    ctx.lineTo(w * 0.45, h * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, h * 0.05);
    ctx.lineTo(0, -h * 0.28);
    ctx.lineTo(w * 0.2, h * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
  'features:6': (ctx, w, h, info) => {
    ctx.save();
    ctx.fillStyle = '#005662';
    ctx.fillRect(-w * 0.25, -h * 0.25, w * 0.5, h * 0.5);
    ctx.fillStyle = '#4dd0e1';
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00acc1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const pulse = Math.sin(info.time * 0.8 + info.seed) * 0.1;
    ctx.ellipse(0, 0, w * (0.32 + pulse * 0.1), h * (0.32 - pulse * 0.05), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
  'features:7': createTreeDrawer('#aeea00'),
  player: createCharacterDrawer({
    cloak: { base: '#3f51b5', highlight: '#7986cb', shadow: '#283593' },
    trim: '#fdd835',
    accent: '#7e57c2',
    hair: { base: '#4e342e', highlight: '#8d6e63' },
    skin: { base: '#f6d4b1', shadow: '#d8a47f' },
    accessory: { type: 'staff', primary: '#6d4c41', secondary: '#ffe0b2', glow: '#80deea' },
    extraDetails: 'none'
  }),
  'npc:traveler': createCharacterDrawer({
    cloak: { base: '#6d4c41', highlight: '#a98274', shadow: '#4e342e' },
    trim: '#ffb74d',
    accent: '#ffcc80',
    hair: { base: '#3e2723', highlight: '#6d4c41' },
    skin: { base: '#f4c7a3', shadow: '#d49466' },
    accessory: { type: 'satchel', primary: '#5d4037', secondary: '#3e2723' },
    extraDetails: 'freckles'
  }),
  'npc:scholar': createCharacterDrawer({
    cloak: { base: '#394554', highlight: '#607d8b', shadow: '#1c242e' },
    trim: '#81d4fa',
    accent: '#4fc3f7',
    hair: { base: '#263238', highlight: '#455a64' },
    skin: { base: '#f4d7c4', shadow: '#c89b86' },
    accessory: { type: 'scroll', primary: '#e0d7c6', secondary: '#b0a38e' },
    extraDetails: 'none'
  }),
  'npc:ranger': createCharacterDrawer({
    cloak: { base: '#2e7d32', highlight: '#66bb6a', shadow: '#1b5e20' },
    trim: '#c0ca33',
    accent: '#a5d6a7',
    hair: { base: '#2f2719', highlight: '#5d4730' },
    skin: { base: '#f0ce9b', shadow: '#c49b6e' },
    accessory: { type: 'bow', primary: '#795548', secondary: '#e0e0e0' },
    extraDetails: 'none'
  }),
  'npc:oracle': createCharacterDrawer({
    cloak: { base: '#4527a0', highlight: '#7e57c2', shadow: '#311b92' },
    trim: '#ce93d8',
    accent: '#b39ddb',
    hair: { base: '#e0e0e0', highlight: '#ffffff' },
    skin: { base: '#f6e7ff', shadow: '#d1b4e8' },
    accessory: { type: 'orb', primary: '#9575cd', glow: '#d1c4e9' },
    extraDetails: 'tattoo'
  })
};

export interface Camera {
  position: Vec2;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  readonly camera: Camera = {
    position: { x: 0, y: 0 },
    viewportWidth: 0,
    viewportHeight: 0,
    zoom: 1
  };
  private showGrid = false;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  setViewport(width: number, height: number): void {
    this.camera.viewportWidth = width;
    this.camera.viewportHeight = height;
  }

  getViewport(): { width: number; height: number } {
    return { width: this.camera.viewportWidth, height: this.camera.viewportHeight };
  }

  setCameraPosition(target: Vec2, lerpAmount: number): void {
    this.camera.position = vec2Lerp(this.camera.position, target, clamp(lerpAmount, 0, 1));
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  toggleDebugGrid(): void {
    this.showGrid = !this.showGrid;
  }

  clear(color = '#0b1020'): void {
    const { viewportWidth, viewportHeight } = this.camera;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    const gradient = this.ctx.createLinearGradient(0, 0, 0, viewportHeight);
    gradient.addColorStop(0, '#050b1a');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, '#122d4b');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    const starCount = Math.min(80, Math.floor((viewportWidth * viewportHeight) / 12000));
    this.ctx.globalAlpha = 0.08;
    this.ctx.fillStyle = '#ffffff';
    for (let i = 0; i < starCount; i += 1) {
      const rx = Math.random() * viewportWidth;
      const ry = Math.random() * viewportHeight * 0.4;
      this.ctx.beginPath();
      this.ctx.arc(rx, ry, Math.random() * 1.2 + 0.2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  worldToScreen(position: Vec2): Vec2 {
    const { position: cameraPos, zoom } = this.camera;
    return {
      x: (position.x - cameraPos.x) * zoom + this.camera.viewportWidth / 2,
      y: (position.y - cameraPos.y) * zoom + this.camera.viewportHeight / 2
    };
  }

  screenToWorld(position: Vec2): Vec2 {
    const { position: cameraPos, zoom } = this.camera;
    return {
      x: (position.x - this.camera.viewportWidth / 2) / zoom + cameraPos.x,
      y: (position.y - this.camera.viewportHeight / 2) / zoom + cameraPos.y
    };
  }

  drawSprite(textureKey: string, x: number, y: number, w: number, h: number): void {
    const texture = resources.getTexture(textureKey);
    const screenPosition = this.worldToScreen({ x, y });
    const width = w * this.camera.zoom;
    const height = h * this.camera.zoom;

    if (!this.isInViewport(screenPosition.x, screenPosition.y, width, height)) {
      return;
    }

    const isGround = textureKey.startsWith('ground:');
    const isFeature = textureKey.startsWith('features:');
    const isEntity = textureKey === 'player' || textureKey.startsWith('npc:');
    const time = getTimeSeconds();
    const seedValue = this.computeSeed(textureKey, x, y);
    const info: ProceduralInfo = {
      time,
      seed: seedValue,
      key: textureKey,
      variant: hashString(textureKey) % 997,
      kind: isGround ? 'ground' : isFeature ? 'feature' : isEntity ? 'entity' : 'ui'
    };

    this.ctx.save();
    this.ctx.translate(screenPosition.x, screenPosition.y);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);

    if (!isGround) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.35;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, h * 0.35, w * 0.4, h * 0.22, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    const drawer = PROCEDURAL_DRAWERS[textureKey];
    if (!texture?.image && drawer) {
      drawer(this.ctx, w, h, info);
    } else if (texture?.image) {
      const { image, frame } = texture;
      this.ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, -w / 2, -h / 2, w, h);
    } else if (drawer) {
      drawer(this.ctx, w, h, info);
    } else {
      this.ctx.fillStyle = this.resolveColor(textureKey);
      this.ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    if (!isGround) {
      const overlay = this.ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      overlay.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      overlay.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      overlay.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'overlay';
      this.ctx.fillStyle = overlay;
      this.ctx.fillRect(-w / 2, -h / 2, w, h);
      this.ctx.restore();
    } else if (isGround && drawer) {
      const light = 0.08 + Math.sin(time * 0.6 + seedValue * 12) * 0.04;
      this.ctx.save();
      this.ctx.globalAlpha = light;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.fillRect(-w / 2, -h / 2, w, h * 0.3);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  drawText(text: string, x: number, y: number, color = '#e6e6e6', size = 16): void {
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px var(--font-family, 'Segoe UI', sans-serif)`;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  flushDebug(): void {
    if (!this.showGrid) {
      return;
    }
    const spacing = 32 * this.camera.zoom;
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.camera.viewportWidth; x += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.camera.viewportHeight);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.camera.viewportHeight; y += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.camera.viewportWidth, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private isInViewport(x: number, y: number, w: number, h: number): boolean {
    return (
      x + w >= 0 &&
      y + h >= 0 &&
      x - w <= this.camera.viewportWidth &&
      y - h <= this.camera.viewportHeight
    );
  }

  private computeSeed(key: string, x: number, y: number): number {
    const raw = hashString(`${key}:${Math.round(x)}:${Math.round(y)}`);
    return (raw % 100000) / 100000;
  }

  private resolveColor(key: string): string {
    const exact = COLOR_PALETTE[key];
    if (exact) {
      return exact;
    }
    const base = COLOR_PALETTE[key.split(':')[0]];
    if (base) {
      return base;
    }
    return this.colorForKey(key);
  }

  private colorForKey(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const r = (hash & 0xff0000) >> 16;
    const g = (hash & 0x00ff00) >> 8;
    const b = hash & 0x0000ff;
    return `rgba(${(r + 256) % 256}, ${(g + 256) % 256}, ${(b + 256) % 256}, 0.8)`;
  }
}
