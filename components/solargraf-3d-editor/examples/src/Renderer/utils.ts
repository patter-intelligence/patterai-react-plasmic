// import * as THREE from "three";

// export function inside(point: { x: any; y: any }, vs: string | any[]) {
//   // ray-casting algorithm based on
//   // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

//   var x = point.x,
//     y = point.y;

//   var inside = false;
//   for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
//     var xi = vs[i].x,
//       yi = vs[i].y;
//     var xj = vs[j].x,
//       yj = vs[j].y;

//     var intersect =
//       yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
//     if (intersect) inside = !inside;
//   }

//   return inside;
// }

// export function clone(
//   obj: {
//     [x: string]: any;
//     constructor: () => any;
//     hasOwnProperty: (arg0: string) => any;
//   } | null
// ) {
//   if (null == obj || "object" != typeof obj) return obj;
//   var copy = obj.constructor();
//   for (var attr in obj) {
//     if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
//   }
//   return copy;
// }

// export function flattenVertices(vertArray = [], scale = 1) {
//   var array = [];

//   // need to dedupe
//   var deduped = vertArray.filter((thing, index) => {
//     const _thing = JSON.stringify(thing);
//     return (
//       index ===
//       vertArray.findIndex((obj) => {
//         return JSON.stringify(obj) === _thing;
//       })
//     );
//   });
//   // .log(`dedupe: ${vertArray.length} -> ${deduped.length}`)

//   deduped.forEach((k: any) => {
//     array.push(k.x * scale, k.y * scale);
//   });
//   return deduped;
// }

// export function computeUVs(geometry: THREE.Geometry | any) {
//   geometry.computeBoundingBox();

//   var max = geometry.boundingBox.max,
//     min = geometry.boundingBox.min;
//   var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
//   var range = new THREE.Vector2(max.x - min.x, max.y - min.y);
//   var faces = geometry.faces;
//   var vertices = geometry.vertices;

//   geometry.faceVertexUvs[0] = [];

//   for (var i = 0, il = faces.length; i < il; i++) {
//     var v1 = vertices[faces[i].a],
//       v2 = vertices[faces[i].b],
//       v3 = vertices[faces[i].c];

//     geometry.faceVertexUvs[0].push([
//       new THREE.Vector2(
//         (v1.x + offset.x) / range.x,
//         (v1.y + offset.y) / range.y
//       ),
//       new THREE.Vector2(
//         (v2.x + offset.x) / range.x,
//         (v2.y + offset.y) / range.y
//       ),
//       new THREE.Vector2(
//         (v3.x + offset.x) / range.x,
//         (v3.y + offset.y) / range.y
//       ),
//     ]);
//   }
//   geometry.uvsNeedUpdate = true;
// }
import * as THREE from "three";

export function inside(point: THREE.Vector2, vs: THREE.Vector2[]): boolean {
  // Ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  const { x, y } = point;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x, yi = vs[i].y;
    const xj = vs[j].x, yj = vs[j].y;
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function clone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => clone(item)) as any;
  if (obj instanceof Object) {
    const copy = { ...(obj as { [key: string]: any }) };
    Object.keys(copy).forEach(
      key => (copy[key] = clone(copy[key]))
    );
    return copy as T;
  }
  throw new Error(`Unable to copy obj! Its type isn't supported.`);
}

export function flattenVertices(vertArray: THREE.Vector3[] = [], scale = 1): THREE.Vector2[] {
  const uniqueVerts = vertArray.filter((v, index, self) =>
    index === self.findIndex((t) => t.x === v.x && t.y === v.y && t.z === v.z)
  );

  return uniqueVerts.map(v => new THREE.Vector2(v.x * scale, v.y * scale));
}

export function computeUVs(geometry: THREE.BufferGeometry): void {
  if (!geometry.attributes.position) {
    console.error("Geometry must have a position attribute");
    return;
  }

  const positions = geometry.attributes.position;
  const count = positions.count;
  const bbox = new THREE.Box3().setFromBufferAttribute(positions as THREE.BufferAttribute);
  const range = new THREE.Vector2(
    bbox.max.x - bbox.min.x,
    bbox.max.y - bbox.min.y
  );

  const uvs = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);

    uvs[i * 2] = (x - bbox.min.x) / range.x;
    uvs[i * 2 + 1] = (y - bbox.min.y) / range.y;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.attributes.uv.needsUpdate = true;
}