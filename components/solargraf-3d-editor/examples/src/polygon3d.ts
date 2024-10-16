/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//determinant of matrix a
function det(a: number[][]) {
  return (
    a[0][0] * a[1][1] * a[2][2] +
    a[0][1] * a[1][2] * a[2][0] +
    a[0][2] * a[1][0] * a[2][1] -
    a[0][2] * a[1][1] * a[2][0] -
    a[0][1] * a[1][0] * a[2][2] -
    a[0][0] * a[1][2] * a[2][1]
  );
}
//unit normal vector of plane defined by points a, b, and c
function unit_normal(a: number[], b: number[], c: number[]) {
  const x = det([
    [1, a[1], a[2]],
    [1, b[1], b[2]],
    [1, c[1], c[2]],
  ]);
  const y = det([
    [a[0], 1, a[2]],
    [b[0], 1, b[2]],
    [c[0], 1, c[2]],
  ]);
  const z = det([
    [a[0], a[1], 1],
    [b[0], b[1], 1],
    [c[0], c[1], 1],
  ]);
  const magnitude = Math.pow(
    Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2),
    0.5
  );
  return [x / magnitude, y / magnitude, z / magnitude];
}
// dot product of vectors a and b
function dot(a: number[], b: number[]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
// cross product of vectors a and b
function cross(a: number[], b: number[]) {
  const x = a[1] * b[2] - a[2] * b[1];
  const y = a[2] * b[0] - a[0] * b[2];
  const z = a[0] * b[1] - a[1] * b[0];
  return [x, y, z];
}

// area of polygon poly
export function polygonArea(poly: string | number[]) {
  if (poly.length < 3) {
    return 0;
  } else {
    const total = [0, 0, 0];
    for (let i = 0; i < poly.length; i++) {
      const vi1 = poly[i];
      if (i === poly.length - 1) {
        // @ts-ignore
        var vi2 = poly[0];
      } else {
        // @ts-ignore
        var vi2 = poly[i + 1];
      }
      // @ts-ignore
      const prod = cross(vi1, vi2);
      total[0] = total[0] + prod[0];
      total[1] = total[1] + prod[1];
      total[2] = total[2] + prod[2];
    }
    // @ts-ignore
    const result = dot(total, unit_normal(poly[0], poly[1], poly[2]));

    return Math.abs(result / 2);
  }
}
