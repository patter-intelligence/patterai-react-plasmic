export function simplifyEdges(vertices: number[], tolerance: number = 0.1): number[] {
  const simplified: number[] = [];
  let lastPoint: number[] | null = null;

  for (let i = 0; i < vertices.length; i += 3) {
    const point = [vertices[i], vertices[i + 1], vertices[i + 2]];

    if (!lastPoint || distanceBetween(lastPoint, point) > tolerance) {
      simplified.push(...point);
      lastPoint = point;
    }
  }

  // Ensure the last point is always included
  const lastOriginalPoint = vertices.slice(-3);
  if (lastPoint && !pointsEqual(lastPoint, lastOriginalPoint)) {
    simplified.push(...lastOriginalPoint);
  }

  return simplified;
}

function distanceBetween(a: number[], b: number[]): number {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)
  );
}

function pointsEqual(a: number[], b: number[]): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
