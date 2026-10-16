export const STUDIO_PALETTE = [
  '#000000', '#ffffff', '#94a3b8', '#475569',
  '#ef4444', '#f97316', '#facc15', '#84cc16',
  '#22c55e', '#14b8a6', '#38bdf8', '#3b82f6',
  '#8b5cf6', '#d946ef', '#f43f5e', '#78350f'
];

export function createPresetMatrix(type: string): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: 16 }, () => Array(16).fill(null));
  const setPx = (x: number, y: number, c: string) => {
    if (x >= 0 && x < 16 && y >= 0 && y < 16) grid[y][x] = c;
  };
  const setSym = (x: number, y: number, c: string) => {
    setPx(x, y, c);
    setPx(15 - x, y, c);
  };

  if (type === 'sword' || type === 'weapon') {
    for (let i = 2; i < 11; i++) {
      setPx(15 - i, i, '#38bdf8');
      setPx(14 - i, i, '#ffffff');
      setPx(15 - i, i + 1, '#3b82f6');
    }
    setPx(4, 9, '#facc15'); setPx(5, 10, '#facc15'); setPx(6, 11, '#facc15'); setPx(7, 12, '#facc15');
    setPx(3, 12, '#78350f'); setPx(2, 13, '#78350f'); setPx(1, 14, '#f43f5e');
  } else if (type === 'shield' || type === 'defense') {
    for (let y = 2; y <= 13; y++) {
      const span = y < 8 ? 5 : Math.max(1, 13 - y);
      for (let dx = 0; dx <= span; dx++) {
        const isBorder = dx === span || y === 2 || y === 13;
        const col = isBorder ? '#facc15' : (dx < 2 && y > 4 && y < 10 ? '#38bdf8' : '#475569');
        setSym(7 - dx, y, col);
      }
    }
  } else if (type === 'pickaxe' || type === 'mining') {
    for (let i = 3; i < 13; i++) {
      setPx(i, 15 - i, '#78350f');
      setPx(i + 1, 15 - i, '#f97316');
    }
    for (let d = 0; d < 5; d++) {
      setPx(9 + d, 2 + d, '#14b8a6');
      setPx(8 + d, 2 + d, '#ffffff');
    }
  } else if (type === 'theft' || type === 'dagger') {
    for (let i = 4; i < 11; i++) {
      setPx(15 - i, i, '#4ade80');
      setPx(14 - i, i, '#ffffff');
    }
    setPx(5, 10, '#000000'); setPx(6, 11, '#000000');
    setPx(4, 11, '#8b5cf6'); setPx(3, 12, '#78350f');
  } else if (type === 'hex' || type === 'scroll') {
    for (let y = 3; y <= 12; y++) {
      for (let x = 4; x <= 11; x++) {
        setPx(x, y, (x + y) % 2 === 0 ? '#8b5cf6' : '#000000');
      }
    }
    setSym(6, 6, '#f43f5e');
    setSym(6, 7, '#facc15');
  } else if (type === 'chrono' || type === 'hourglass') {
    for (let x = 3; x <= 12; x++) {
      setPx(x, 2, '#facc15');
      setPx(x, 13, '#facc15');
    }
    for (let y = 3; y <= 7; y++) {
      const w = 8 - y;
      for (let dx = 0; dx <= w; dx++) {
        setSym(7 - dx, y, dx === w ? '#94a3b8' : '#38bdf8');
        setSym(7 - dx, 15 - y, dx === w ? '#94a3b8' : '#facc15');
      }
    }
  } else if (type === 'alchemy' || type === 'flask') {
    for (let x = 6; x <= 9; x++) { setPx(x, 2, '#94a3b8'); setPx(x, 3, '#94a3b8'); }
    for (let y = 4; y <= 12; y++) {
      const w = Math.min(6, y - 2);
      for (let dx = 0; dx <= w; dx++) {
        setSym(7 - dx, y, y > 7 ? '#2dd4bf' : '#ffffff');
      }
    }
  } else if (type === 'trade' || type === 'crest') {
    for (let y = 3; y <= 12; y++) {
      for (let x = 3; x <= 12; x++) {
        if (Math.hypot(x - 7.5, y - 7.5) <= 4.8) {
          setPx(x, y, '#facc15');
        }
      }
    }
    setPx(7, 6, '#451a03'); setPx(8, 6, '#451a03');
    setPx(7, 7, '#451a03'); setPx(8, 7, '#451a03');
    setPx(7, 8, '#451a03'); setPx(8, 8, '#451a03');
  } else if (type === 'regen' || type === 'ring') {
    for (let y = 3; y <= 12; y++) {
      for (let x = 3; x <= 12; x++) {
        const d = Math.hypot(x - 7.5, y - 7.5);
        if (d >= 3.2 && d <= 5.0) setPx(x, y, '#fb7185');
        else if (d <= 2.2 && y <= 6) setPx(x, y, '#fde047');
      }
    }
  } else if (type === 'cosmic' || type === 'orb') {
    for (let y = 3; y <= 12; y++) {
      for (let x = 3; x <= 12; x++) {
        if (Math.hypot(x - 7.5, y - 7.5) <= 4.5) {
          setPx(x, y, (x + y) % 3 === 0 ? '#f472b6' : '#ec4899');
        }
      }
    }
    setPx(6, 6, '#ffffff');
    setPx(7, 6, '#ffffff');
  }
  return grid;
}

export function createFlagPresetMatrix(style: string): string[][] {
  const flag: string[][] = Array.from({ length: 8 }, () => Array(12).fill('#1e293b'));
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 12; x++) {
      if (style === 'iran_inspired') {
        flag[y][x] = y < 3 ? '#22c55e' : (y < 5 ? '#ffffff' : '#ef4444');
        if (y >= 3 && y <= 4 && x >= 5 && x <= 6) flag[y][x] = '#facc15';
      } else if (style === 'pirate') {
        flag[y][x] = '#000000';
        if ((y >= 2 && y <= 5 && x >= 4 && x <= 7) || (x === y + 2) || (x === 10 - y)) flag[y][x] = '#ffffff';
      } else if (style === 'cyberpunk') {
        flag[y][x] = (x + y) % 2 === 0 ? '#06b6d4' : '#ec4899';
        if (x >= 4 && x <= 7 && y >= 2 && y <= 5) flag[y][x] = '#fde047';
      } else {
        flag[y][x] = (x === 0 || x === 11 || y === 0 || y === 7) ? '#facc15' : '#8b5cf6';
        if (y >= 2 && y <= 5 && x >= 4 && x <= 7) flag[y][x] = '#f43f5e';
      }
    }
  }
  return flag;
}

export function renderMatrixToCanvas(
  canvas: HTMLCanvasElement | null,
  matrix: (string | null)[][] | string[][]
) {
  if (!canvas || !matrix) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const rows = matrix.length;
  const cols = matrix[0] ? matrix[0].length : 16;
  const cellW = w / cols;
  const cellH = h / rows;
  ctx.clearRect(0, 0, w, h);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const col = matrix[y] && matrix[y][x];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(Math.floor(x * cellW), Math.floor(y * cellH), Math.ceil(cellW), Math.ceil(cellH));
      }
    }
  }
}
