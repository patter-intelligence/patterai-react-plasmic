import React, { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { generateShapeFromEavePoint } from "./utils";

export function Edge({ edge, vertices, edgeInOrder }) {
  const lineGeometryRef = useRef<THREE.BufferGeometry>();
  const { points, eaveGeometry } = useMemo(() => {
    let points = [];
    // Avoid to change the original parameter
    let point1 = { position: { ...vertices[edge.start].position } };
    let point2 = { position: { ...vertices[edge.end].position } };
    point1.position.z =
      vertices[edge.start].elevations[edgeInOrder.startElevation];
    point2.position.z = vertices[edge.end].elevations[edgeInOrder.endElevation];
    points.push(
      new THREE.Vector3(
        point1.position.x,
        -point1.position.y,
        point1.position.z
      )
    );
    points.push(
      new THREE.Vector3(
        point2.position.x,
        -point2.position.y,
        point2.position.z
      )
    );
    let eaveGeometry;
    if (["eave", "rake", "hip", "valley"].includes(edge.roofEdgeType)) {
      eaveGeometry = generateShapeFromEavePoint([point1, point2]);
    }

    return { eaveGeometry, points };
  }, []);
  useEffect(() => {
    if (lineGeometryRef.current) {
      lineGeometryRef.current.setFromPoints(points);
    }
  }, []);

  return (
    <>
      <line>
        <bufferGeometry attach="geometry" ref={lineGeometryRef as any} />
        <lineBasicMaterial
          attach="material"
          color={16777215}
          fog={false}
          linewidth={2}
        />
      </line>
      {eaveGeometry ? (
        <mesh castShadow geometry={eaveGeometry}>
          <meshPhongMaterial
            attach="material"
            color={12105912}
            side={THREE.DoubleSide}
            flatShading
            dithering
          />
        </mesh>
      ) : null}
    </>
  );
}
