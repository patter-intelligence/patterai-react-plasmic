import React, { useEffect } from "react";
import * as THREE from "three";
// import FastAverageColor from "fast-average-color";
import { useMapTexture } from "./AerialMap";
// const fac = new FastAverageColor();
// import { Sky } from "three/examples/jsm/objects/Sky";
// import { Water } from "three/examples/jsm/objects/Water";

function Skydome() {
  const groundMatRef = React.useRef();
  const mapTexture = useMapTexture({ textureLength: 81 });

  React.useEffect(() => {
    async function setupGround() {
      //@ts-ignore

      if (mapTexture.image) {
        try {
          //@ts-ignore

          const color = "red"; //await fac.getColorAsync(mapTexture.image);
          // @ts-ignore
          groundMatRef.current.color = new THREE.Color(color.hex);
        } catch (err) {
          try {
            // @ts-ignore
            groundMatRef.current.color = new THREE.Color(0xcccccc);
          } catch (err) {
            console.error(err);
          }
        }
      } else {
        // @ts-ignore
        groundMatRef.current.color = new THREE.Color(0xcccccc);
      }
    }
    if (groundMatRef.current) setupGround();
  }, [mapTexture]);

  return (
    <>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <shaderMaterial
          attach="material"
          side={THREE.BackSide}
          vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `}
          fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize( vWorldPosition + offset ).y;
            gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
          }
        `}
          uniforms={{
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0xffffff) },
            offset: { value: 33 },
            exponent: { value: 0.6 },
          }}
        />
        <sphereGeometry attach="geometry" args={[4000, 32, 15]} />
      </mesh>
      {/* Remove the ground plane from Skydome component */}
    </>
  );
}

export default Skydome;

// import { Sky } from '@react-three/drei'

// const SkyElement = () => {
// 	return (
// 		<Sky
// 			distance={45000}
// 			sunPosition={[1, 1, 0]}
// 			inclination={0}
// 			azimuth={0.25}
// 			rayleigh={0.1}
// 			turbidity={0.1}
// 			mieCoefficient={0.02}
// 		/>
// 	)
// }

// export default SkyElement
