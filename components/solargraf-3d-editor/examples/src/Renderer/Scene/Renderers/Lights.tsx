import React, { useEffect, useCallback, useRef } from "react";
import * as THREE from "three";
//@ts-ignore
import { Sky } from "three/examples/jsm/objects/Sky";
//@ts-ignore
import { Water } from "three/examples/jsm/objects/Water";

const EnvironmentSetup: React.FC<{
  sceneRef: React.MutableRefObject<THREE.Scene>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer>;
}> = React.memo(({ sceneRef, rendererRef }) => {
  const groundPlaneRef = useRef<THREE.Mesh | null>(null);

  const updateTexture = useCallback(() => {
    if (rendererRef.current && sceneRef.current) {
      const camera = sceneRef.current.getObjectByName('camera') as THREE.Camera;
      if (camera) {
        rendererRef.current.render(sceneRef.current, camera);
      } else {
        // console.error("Camera not found in the scene");
      }
    }
  }, [sceneRef, rendererRef]);

  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) {
      console.error("sceneRef.current or rendererRef.current is undefined");
      return;
    }

    // Sky
    const sky = new Sky();
    sky.scale.setScalar(450000);
    sceneRef.current.add(sky);

    // Sun
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sceneRef.current.add(sunLight);

    // Hemisphere light for better color blending
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x87ceeb, 0.6);
    sceneRef.current.add(hemiLight);

    // Ground plane with texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "https://fyqqwknvbyngkbhofnfv.supabase.co/storage/v1/object/public/patter-ai-static-assets/textures/paper.jpeg",
      (groundTexture) => {
        groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(200, 200);
        groundTexture.anisotropy = 16;

        const planeGeometry = new THREE.PlaneGeometry(10000, 10000);
        const planeMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.5,
          map: groundTexture,
          envMapIntensity: 1
        });

        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;
        // plane.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
        sceneRef.current.add(plane);
        groundPlaneRef.current = plane;

        updateTexture();
      },
      undefined,
      (error) => {
        console.error("Error loading texture:", error);
      }
    );

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    sceneRef.current.add(ambientLight);

    const effectController = {
      turbidity: 8,
      rayleigh: 1.5,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.7,
      elevation: 45,
      azimuth: 180,
    };

    const uniforms = sky.material.uniforms;
    uniforms["turbidity"].value = effectController.turbidity;
    uniforms["rayleigh"].value = effectController.rayleigh;
    uniforms["mieCoefficient"].value = effectController.mieCoefficient;
    uniforms["mieDirectionalG"].value = effectController.mieDirectionalG;

    const updateSun = () => {
      const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
      const theta = THREE.MathUtils.degToRad(effectController.azimuth);
      sunLight.position.setFromSphericalCoords(100, phi, theta);
      uniforms["sunPosition"].value.copy(sunLight.position);
      sky.material.uniformsNeedUpdate = true;
    };

    updateSun();

    // Set up an animation loop to continuously update the scene
    const animate = () => {
      requestAnimationFrame(animate);
      updateTexture();
    };
    animate();

    // Clean up function
    return () => {
      if (groundPlaneRef.current) {
        sceneRef.current.remove(groundPlaneRef.current);
        groundPlaneRef.current.geometry.dispose();
        (groundPlaneRef.current.material as THREE.Material).dispose();
      }
    };
  }, [sceneRef, rendererRef]);

  return null;
});

export default EnvironmentSetup;
