import { distanceToSegment } from './SubmarineCombat.js';

export const GLACIAL_ZONE_INDEX = 4;
export const FIRST_GLACIAL_PASSAGE = 8;
export const SECOND_GLACIAL_PASSAGE = 9;

type Point = readonly [number, number];
const leftWall: readonly Point[] = [
  [0, 0], [0.29, 0], [0.30, 0.20], [0.29, 0.41], [0.30, 0.52],
  [0.28, 0.65], [0.29, 0.77], [0.27, 0.87], [0.28, 1], [0, 1],
];
export const GLACIAL_PASSAGE_WALLS: Readonly<Partial<Record<number, readonly (readonly Point[])[]>>> = {
  [FIRST_GLACIAL_PASSAGE]: [
    leftWall,
    [[0, 0], [1, 0], [1, 0.31], [0.91, 0.30], [0.79, 0.32], [0.66, 0.30], [0, 0.30]],
    [[0.39, 0.29], [0.51, 0.29], [0.45, 0.59]],
    [[0.52, 0.29], [0.60, 0.29], [0.56, 0.50]],
    [[0.59, 1], [0.62, 0.73], [0.70, 0.59], [0.84, 0.57], [0.94, 0.58], [1, 0.60], [1, 1]],
  ],
  [SECOND_GLACIAL_PASSAGE]: [
    leftWall,
    [[0.63, 0], [1, 0], [1, 1], [0.58, 1], [0.60, 0.82], [0.63, 0.65], [0.64, 0.41], [0.65, 0.17]],
    [[0, 0.94], [0.29, 0.94], [0.45, 0.92], [0.59, 0.94], [1, 0.94], [1, 1], [0, 1]],
  ],
};

export function hitsGlacialWall(zone: number, x: number, y: number, width: number, height: number): boolean {
  const walls = GLACIAL_PASSAGE_WALLS[zone];
  if (!walls) return false;
  // Use the submarine silhouette with a little clearance on narrow screens.
  const rx = Math.min(27, width * 0.075);
  const ry = Math.min(16, height * 0.05);
  return walls.some(points => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [ax, ay] = points[j];
      const [bx, by] = points[i];
      const sx = (ax * width - x) / rx;
      const sy = (ay * height - y) / ry;
      const ex = (bx * width - x) / rx;
      const ey = (by * height - y) / ry;
      if (distanceToSegment(0, 0, sx, sy, ex, ey) <= 1) return true;
      if ((sy > 0) !== (ey > 0) && sx - sy * (ex - sx) / (ey - sy) > 0) inside = !inside;
    }
    return inside;
  });
}

export function glacialPassageExit(zone: number, x: number, y: number, width: number, height: number) {
  const inset = Math.min(54, height * 0.18);
  const sideInset = Math.min(54, width * 0.2);
  if (zone === GLACIAL_ZONE_INDEX && x <= 26) {
    return { zone: FIRST_GLACIAL_PASSAGE, x: width - sideInset, y: height * 0.45 };
  }
  if (zone === FIRST_GLACIAL_PASSAGE && x >= width - 26) {
    return { zone: GLACIAL_ZONE_INDEX, x: sideInset, y: height * 0.45 };
  }
  if (zone === FIRST_GLACIAL_PASSAGE && y >= height - 22) {
    return { zone: SECOND_GLACIAL_PASSAGE, x: width * 0.45, y: inset };
  }
  if (zone === SECOND_GLACIAL_PASSAGE && y <= 26) {
    return { zone: FIRST_GLACIAL_PASSAGE, x: width * 0.45, y: height - inset };
  }
  return undefined;
}
