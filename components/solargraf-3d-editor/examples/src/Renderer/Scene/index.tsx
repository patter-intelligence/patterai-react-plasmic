import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import EnvironmentSetup from "./Renderers/Lights";
import Controls from "./Controls/CameraControls";
import SiteModel from "./Renderers";
import Skydome from "./Renderers/Skydome";
import { OrbitControls } from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";
import { useStore } from "./context/SolargrafDesignContext";
// import testCombinedDataMinimal from "../../testCombinedDataMinimal";

function Scene({
  children,
  disableControls = false,
}: {
  children?: any;
  disableControls?: boolean;
}) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<typeof OrbitControls | null>(null);

  const {mode} = useStore();
  // const panelsRef = useRef<{ [key: string]: THREE.Group }>({});
  // const [metadata] = useState(() => testCombinedDataMinimal.initialDesign);

  const { scene, gl, camera } = useThree();

  useEffect(() => {
    sceneRef.current = scene;
    rendererRef.current = gl;
    cameraRef.current = camera as THREE.PerspectiveCamera;

    // Adjust camera position to compensate for scene rotation
    camera.position.set(0, 100, 0);
    camera.lookAt(0, 0, 0);
   
  }, [scene, gl, camera]);

  useFrame(() => {
    if (controlsRef.current) {
      //@ts-ignore
      controlsRef.current.update();
    }
  });

  useEffect(() => {
    if (scene) {
      scene.fog = new THREE.Fog(scene.background as any, 1, 5000);
      scene.rotation.x = -Math.PI / 2;
    }
  }, [scene]);

  return (
    <>
      {sceneRef.current && rendererRef.current && (
        <EnvironmentSetup sceneRef={sceneRef} rendererRef={rendererRef} />
      )}
      <Controls disable={!!disableControls} />
      <Skydome  />

      <SiteModel />
      {children}
    </>
  );
}

export default Scene;
