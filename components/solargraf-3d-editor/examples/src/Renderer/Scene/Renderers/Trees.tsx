import React, { useMemo } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import { Instances, Instance } from "@react-three/drei";
import { useStore } from "../context/SolargrafDesignContext";
import { TextureLoader } from "three/src/loaders/TextureLoader";

interface ISolarGrafTree {
  position: { x: number; y: number; z: number };
  trunkHeight: number;
  trunkRadius: number;
  crownVerticalRadius: number;
  crownHorizontalRadius: number;
}

interface TreeProps {
  tree: ISolarGrafTree;
}

const Tree: React.FC<TreeProps> = React.memo(({ tree }) => {
  const {
    position,
    trunkHeight,
    trunkRadius,
    crownHorizontalRadius,
    crownVerticalRadius,
  } = tree;

  const barkTexture = useLoader(TextureLoader, 'https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
  barkTexture.wrapS = barkTexture.wrapT = THREE.RepeatWrapping;
  barkTexture.repeat.set(4, 4);

  const trunkGeometry = useMemo(() => {
    const segments = 12;
    const heightSegments = 8;
    const geometry = new THREE.CylinderGeometry(
      trunkRadius * 0.8,
      trunkRadius,
      trunkHeight,
      segments,
      heightSegments,
      true
    );

    // Add some randomness to the trunk's shape
    const positionAttribute = geometry.getAttribute('position');
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      const theta = Math.atan2(vertex.x, vertex.z);
      const radius = trunkRadius + (Math.random() - 0.5) * 0.1 * trunkRadius;
      vertex.x = radius * Math.sin(theta);
      vertex.z = radius * Math.cos(theta);
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals();
    return geometry;
  }, [trunkRadius, trunkHeight]);

  const leafGeometry = useMemo(() => new THREE.SphereGeometry(0.1, 8, 8), []);

  const crownRadius = Math.max(crownHorizontalRadius, crownVerticalRadius);
  const leafCount = Math.floor(crownRadius * 1000);

  const leafPositions = useMemo(() => {
    return Array.from({ length: leafCount }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = crownRadius * Math.cbrt(Math.random());
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      return new THREE.Vector3(x, z, y);
    });
  }, [crownRadius, leafCount]);

  const trunkMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: barkTexture,
        color: 0x8B4513,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
    [barkTexture]
  );

  const leafMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x78bd49,
        roughness: 0.7,
        metalness: 0.1,
      }),
    []
  );

  const leafInstancesRef = React.useRef<THREE.InstancedMesh[]>([]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    leafPositions.forEach((pos, i) => {
      const instance = leafInstancesRef.current[i];
      if (instance) {
        instance.position.x = pos.x + Math.sin(time + i * 0.1) * 0.02;
        instance.position.y = pos.y + Math.sin(time + i * 0.2) * 0.02;
        instance.position.z = pos.z + Math.cos(time + i * 0.1) * 0.02;
      }
    });
  });

  return (
    <group position={[position.x, position.z, position.y]}>
      <mesh
        geometry={trunkGeometry}
        material={trunkMaterial}
        position={[0, 0, trunkHeight / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <group position={[0, 0, trunkHeight]}>
        <Instances
          limit={leafCount}
          //@ts-ignore
          ref={leafInstancesRef}
          geometry={leafGeometry}
          material={leafMaterial}
        >
          {leafPositions.map((pos, i) => (
            <Instance
              key={i}
              position={[pos.x, pos.y, pos.z]}
              scale={[1, 1, 1]}
            />
          ))}
        </Instances>
      </group>
    </group>
  );
});

interface TreesProps {
  
}

const Trees: React.FC<TreesProps> = () => {
  const { siteModel } = useStore();
  const trees = useMemo(() => {
    //@ts-ignore
    return Object.values(siteModel?.drawing?.state?.models?.trees || {});
  }, [siteModel]);

  // console.log("trees:", trees);

  return (
    <>
      {trees.map((tree, index) => (
        <Tree key={`tree-${index}`} tree={tree as ISolarGrafTree} />
      ))}
    </>
  );
};

export default React.memo(Trees);
