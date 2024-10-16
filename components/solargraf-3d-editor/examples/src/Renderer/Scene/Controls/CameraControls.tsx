import React, { useEffect, useRef, useCallback, useState } from "react";
import CameraControls from "camera-controls";
import * as THREE from "three";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { useStore } from "../context/SolargrafDesignContext";
import Compass from "./Compass";

// Extend camera-controls to be recognized by react-three-fiber
CameraControls.install({ THREE });
extend({ CameraControls });

interface ControlsProps {
  disable?: boolean;
  initialPosition?: [number, number, number];
}

// const Controls: React.FC<ControlsProps> = ({ disable = false }) => {
//   const cameraControlsRef = useRef<CameraControls>(null);
//   const { camera, gl, clock } = useThree();

//   // This effect will initialize and clean up the camera controls
//   useEffect(() => {
//     const controls = cameraControlsRef.current;
//     return () => {
//       controls?.dispose();
//     };
//   }, []);

//   useFrame(() => {
//     if (!disable && cameraControlsRef.current) {
//       const delta = clock.getDelta();
//       if (cameraControlsRef.current.update(delta)) {
//         gl.render();
//       }
//     }
//   });

//   // Enhanced cinematic controls settings
//   return (
//     // @ts-ignore
//     <cameraControls
//       ref={cameraControlsRef}
//       enabled={!disable}
//       args={[camera, gl.domElement]}
//       dampingFactor={0.1} // Increased for smoother transitions
//       minDistance={20} // Adjust for better framing
//       maxDistance={200} // Adjust for wider range
//       minPolarAngle={Math.PI / 6} // Adjust for better angle range
//       maxPolarAngle={Math.PI / 3} // Adjust for better angle range
//     />
//   );
// };

function Controls({ disable = false, initialPosition = [0, 15, 30] }: ControlsProps) {
  const ccontrolRef = useRef<CameraControls | null>(null);
  const { camera, gl, clock, scene } = useThree();
  const { mode } = useStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevModeRef = useRef(mode);

  const transitionCamera = useCallback((to2D: boolean) => {
    if (ccontrolRef.current) {
      setIsTransitioning(true);
      const duration = 0.01; // Animation duration in seconds

      const targetPosition = to2D ? new THREE.Vector3(0, 30, 0) : new THREE.Vector3(...initialPosition);
      const targetLookAt = new THREE.Vector3(0, 0, 0);
      const targetZoom = to2D ? 25 : 30;

      ccontrolRef.current.setLookAt(
        targetPosition.x, targetPosition.y, targetPosition.z,
        targetLookAt.x, targetLookAt.y, targetLookAt.z,
        true
      );

      ccontrolRef.current.dollyTo(targetZoom, true);

      if (!to2D) {
        ccontrolRef.current.rotateTo(Math.PI / 6, Math.PI / 4, true);
      }

      ccontrolRef.current.fitToBox(
        new THREE.Box3(new THREE.Vector3(-15, -15, -15), new THREE.Vector3(15, 15, 15)),
        true,
        { paddingLeft: 5, paddingRight: 5, paddingBottom: 5, paddingTop: 5 }
      );

      // Set a timeout to mark the end of the transition
      setTimeout(() => setIsTransitioning(false), duration * 1000);
    }
  }, [initialPosition]);

  useEffect(() => {
    if (mode !== prevModeRef.current) {
      transitionCamera(mode === "2D");
      prevModeRef.current = mode;
    }
  }, [mode, transitionCamera]);

  useFrame((_, delta) => {
    if (ccontrolRef.current) {
      ccontrolRef.current.update(delta);
    }
  });

  const handleCompassRotate = (angle: number) => {
    if (ccontrolRef.current) {
      ccontrolRef.current.rotate(angle, 0, true);
    }
  };

  return (
    <>
      {/* @ts-ignore */}
      <cameraControls
        ref={ccontrolRef}
        enabled={!disable}
        args={[camera, gl.domElement]}
        dampingFactor={0.05}
        draggingDampingFactor={0.1}
        minDistance={5}
        maxDistance={100}
        minPolarAngle={mode === "2D" ? 0 : Math.PI / 8}
        maxPolarAngle={mode === "2D" ? Math.PI / 2 : Math.PI / 2.2}
        minAzimuthAngle={mode === "2D" ? -Math.PI / 4 : -Infinity}
        maxAzimuthAngle={mode === "2D" ? Math.PI / 4 : Infinity}
      />
      <Compass size={80} onRotate={handleCompassRotate} />
    </>
  );
}

export default React.memo(Controls);
