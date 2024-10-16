export function simplifyPolygon(points: number[], tolerance: number): number[] {
  if (points.length <= 6) return points; // Don't simplify if there are 3 or fewer points

  const findPerpendicularDistance = (p: number[], p1: number[], p2: number[]): number => {
    const [x, y] = p;
    const [x1, y1] = p1;
    const [x2, y2] = p2;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  const simplifyDouglasPeucker = (points: number[], first: number, last: number, tolerance: number, output: number[]): void => {
    if (last - first <= 2) {
      for (let i = first; i <= last; i += 2) {
        output.push(points[i], points[i + 1]);
      }
      return;
    }

    let maxDistance = 0;
    let index = 0;

    for (let i = first + 2; i < last; i += 2) {
      const distance = findPerpendicularDistance(
        [points[i], points[i + 1]],
        [points[first], points[first + 1]],
        [points[last], points[last + 1]]
      );

      if (distance > maxDistance) {
        index = i;
        maxDistance = distance;
      }
    }

    if (maxDistance > tolerance) {
      simplifyDouglasPeucker(points, first, index, tolerance, output);
      simplifyDouglasPeucker(points, index, last, tolerance, output);
    } else {
      output.push(points[first], points[first + 1]);
      output.push(points[last], points[last + 1]);
    }
  };

  const result: number[] = [];
  simplifyDouglasPeucker(points, 0, points.length - 2, tolerance, result);
  return result;
}
