import React from "react";
import * as THREE from "three";

export default function Lights() {
  return (
    <group>
      <hemisphereLight color={0xddeeff} groundColor={0x0f0e0d} intensity={1} />
      <spotLight
        color={0xffffff}
        intensity={1}
        angle={Math.PI / 4}
        penumbra={0.05}
        decay={1}
        distance={200}
        castShadow
        shadow={{
          mapSize: {
            width: 1024,
            height: 1024,
          },
          camera: {
            near: 10,
            far: 200,
          },
        }}
      />
      <directionalLight
        color={0xffffff}
        position={new THREE.Vector3(0, 1, 1)}
      />
    </group>
  );
}
