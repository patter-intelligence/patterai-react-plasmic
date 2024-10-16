import * as THREE from "three";
import { extend } from "@react-three/fiber";
import { computeUVs } from "../../utils";
import LineSegments2 from "../FatLines/LineSegments2";
// import LineMaterial from "../FatLines/LineMaterial";
import * as turf from "@turf/turf";
function getSurfaceCentroids(
  siteModel: {
    drawing: {
      state: {
        models: { roofOutlines: { [s: string]: unknown } | ArrayLike<unknown> };
      };
    };
  },
  surfaceId: any
) {
  let surfaces: any[] = [];
  Object.values(siteModel.drawing.state.models.roofOutlines).forEach(
    (outline: any) => {
      Object.values(outline.sections)
        .filter((s: any) => s.id == surfaceId)
        .forEach((section: any) => {
          let buffSurface = {
            id: section.id,
            path: [],
            topZ: 0,
            bottomZ: Infinity,
          };
          section.order.forEach((o: { id: string | number }) => {
            const startVertex = outline.vertices[outline.edges[o.id].start];
            const startPoint = {
              ...startVertex.position,
              z: Object.values(startVertex.elevations || {})[0],
            };
            const endVertex = outline.vertices[outline.edges[o.id].end];
            const endPoint = {
              ...endVertex.position,
              z: Object.values(endVertex.elevations || {})[0],
            };
            buffSurface.topZ = Math.max(buffSurface.topZ, startPoint.z);
            buffSurface.topZ = Math.max(buffSurface.topZ, endPoint.z);
            buffSurface.bottomZ = Math.min(buffSurface.bottomZ, startPoint.z);
            buffSurface.bottomZ = Math.min(buffSurface.bottomZ, endPoint.z);
            buffSurface.path.push(startPoint);
            buffSurface.path.push(endPoint);
          });
          surfaces.push(buffSurface);
        });
    }
  );
  surfaces = surfaces.map((s) => {
    const polygon = turf.multiPoint(
      s.path.map((p: { x: any; y: any }) => [p.x, p.y])
    );
    const centroidBaseCordsList = turf.centroid(polygon).geometry.coordinates;
    s.topCentroid = {
      x: centroidBaseCordsList[0],
      y: -centroidBaseCordsList[1],
      z: s.topZ,
    };
    s.bottomCentroid = {
      x: centroidBaseCordsList[0],
      y: -centroidBaseCordsList[1],
      z: s.bottomZ,
    };
    delete s.topZ;
    delete s.bottomZ;
    return s;
  });
  return surfaces[0];
}

export function surfaceIsEnabledForPanels(
  siteModel: {
    drawing: {
      state: {
        models: { panelArrays: { [s: string]: any } | ArrayLike<unknown> };
      };
    };
  },
  surfaceId: any
) {
  return !!Object.values(siteModel.drawing.state.models.panelArrays).filter(
    (p) => p.roofSectionId == surfaceId
  ).length;
}

// extend({ LineSegments2, LineMaterial });

export function getRoofColor(roofColors: { [x: string]: {} }, index: number) {
  // @ts-ignore
  const { color } = roofColors[index] || {};
  if (!color) {
    return "#CCC";
  }
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`;
}

// export function generateShapeFromEavePoint(
//   eavePoint: { position: any }[] | [any, any]
// ) {
//   const wall = new THREE.Geometry();

//   const vertices = [];

//   let [pt1, pt2] = eavePoint;

//   vertices.push(pt1.position.x, -pt1.position.y, pt1.position.z);
//   vertices.push(pt1.position.x, -pt1.position.y, 0);
//   wall.vertices.push(new THREE.Vector3(pt1.position.x, -pt1.position.y, 0));
//   wall.vertices.push(
//     new THREE.Vector3(pt1.position.x, -pt1.position.y, pt1.position.z)
//   );

//   vertices.push(pt2.position.x, -pt2.position.y, pt1.position.z);
//   vertices.push(pt2.position.x, -pt2.position.y, 0);
//   wall.vertices.push(
//     new THREE.Vector3(pt2.position.x, -pt2.position.y, pt2.position.z)
//   );
//   wall.vertices.push(new THREE.Vector3(pt2.position.x, -pt2.position.y, 0));

//   wall.faces.push(new THREE.Face3(0, 1, 2));
//   wall.faces.push(new THREE.Face3(0, 1, 3));
//   wall.faces.push(new THREE.Face3(1, 2, 3));

//   const color = new THREE.Color(0xffffff);
//   color.setHex(Math.random() * 0xffffff);

//   computeUVs(wall);

//   return wall;
// }


export function generateShapeFromEavePoint(
  eavePoint: { position: THREE.Vector3 }[] | [THREE.Vector3, THREE.Vector3]
): THREE.BufferGeometry {
  const [pt1, pt2] = eavePoint;

  const positions = new Float32Array([
    //@ts-ignore
    pt1.position.x, -pt1.position.y, pt1.position.z,
    //@ts-ignore
    pt1.position.x, -pt1.position.y, 0,
    //@ts-ignore
    pt2.position.x, -pt2.position.y, pt2.position.z,
    //@ts-ignore
    pt2.position.x, -pt2.position.y, 0
  ]);

  const indices = new Uint16Array([
    0, 1, 2,
    2, 1, 3,
    0, 2, 1,
    1, 2, 3
  ]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  geometry.computeVertexNormals();

  // Generate UVs
  const uvs = new Float32Array([
    0, 1,
    0, 0,
    1, 1,
    1, 0
  ]);
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  return geometry;
}