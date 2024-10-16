import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { BoxGeometry } from "three";
import { useMapTexture } from "./AerialMap";
import { computeUVs } from "../../utils";
import { useStore } from "../context/SolargrafDesignContext";

function CircleObstruction({ obstruction: obs }) {
  // const depth = parseFloat(obs.depth);
  // const radiusTop = parseFloat(obs.radius) * 0.8;
  // const radiusBottom = parseFloat(obs.radius) * 0.8;
  // console.log("CircleObstruction", obs);

  // Fix possible string values
  const depth =
    typeof obs.depth === "string" ? parseFloat(obs.depth) : obs.depth;
  const radius =
    typeof obs.radius === "string" ? parseFloat(obs.radius) : obs.radius;
  const radiusTop = radius * 0.8;
  const radiusBottom = radius * 0.8;
  const posX =
    typeof obs.position.x === "string"
      ? parseFloat(obs.position.x)
      : obs.position.x;
  const posZ =
    typeof obs.position.y === "string"
      ? parseFloat(obs.position.y)
      : obs.position.y;
  const posY =
    typeof obs.position.z === "string"
      ? parseFloat(obs.position.z)
      : obs.position.z;

  return (
    <>
      <mesh
        position={[posX, -(posY + depth / 2), posZ]}
        rotation={new THREE.Euler(Math.PI / 2, 0, 0)}
      >
        <cylinderGeometry
          attach="geometry"
          args={[radiusTop, radiusBottom, depth, 64]}
        />
        <meshBasicMaterial
          attach="material"
          color={0xe0e2e2}
          side={THREE.FrontSide}
          blending={THREE.NoBlending}
        />
      </mesh>
    </>
  );
}
function RectangularObstruction({ obstruction, siteModel }) {
  const { mapTexture } = useMapTexture({  });
  const obstructionMesh = useRef();

  // Convert string values to numbers
  const posX = Number(obstruction.position.x);
  const posY = Number(obstruction.position.y);
  const posZ = Number(obstruction.position.z);
  const rotation = Number(obstruction.rotation);
  const width = Number(obstruction.width);
  const depth = Number(obstruction.depth);
  const height = Number(obstruction.height);

  const { obstructionGeometry, obstructionTexture } = useMemo(() => {
    const obstructionGeometry = new THREE.BoxGeometry(height, depth, width);

    let obstructionTexture = null;
    if (mapTexture) {
      obstructionTexture = mapTexture.clone();
      //@ts-ignore
      obstructionTexture.encoding = THREE.sRGBEncoding;
      //@ts-ignore
      obstructionTexture.colorSpace = THREE.SRGBColorSpace;
      obstructionTexture.needsUpdate = true;

      const metersPerPx = siteModel.metersPerPixelRatio;
      const widthMeters = width;
      const depthMeters = depth;

      const scaleX =
        (obstructionTexture.image.width * metersPerPx) / widthMeters;
      const scaleY =
        (obstructionTexture.image.height * metersPerPx) / depthMeters;

      obstructionTexture.repeat.set(1 / scaleX, 1 / scaleY);
      obstructionTexture.offset.set(
        0.5 + posX / metersPerPx / obstructionTexture.image.width,
        0.5 - posZ / metersPerPx / obstructionTexture.image.height
      );

      // Modify UVs to apply texture only to the top face
      const uvAttribute = obstructionGeometry.attributes.uv;
      const positionAttribute = obstructionGeometry.attributes.position;
      for (let i = 0; i < positionAttribute.count; i++) {
        const y = -positionAttribute.getZ(i);
        if (Math.abs(y - height / 2) < 0.001) {
          // Top face
          const x = positionAttribute.getX(i);
          const z = positionAttribute.getY(i);
          uvAttribute.setXY(
            i,
            (x + width / 2) / width,
            (z + depth / 2) / depth
          );
        } else {
          // Other faces
          uvAttribute.setXY(i, 0, 0);
        }
      }
      uvAttribute.needsUpdate = true;
    }

    return { obstructionGeometry, obstructionTexture };
  }, [mapTexture, siteModel, width, depth, height, posX, posY]);

  return (
    <mesh
      // rotation={[0, (rotation * Math.PI) / 180, 0]}
      rotation={[Math.PI / 2, (rotation * (Math.PI * 2)) / 360, 0]}
      position={[posX, -posZ, posY]}
      ref={obstructionMesh}
      geometry={obstructionGeometry}
    >
      <meshPhongMaterial
        attach="material"
        color={0xe0e2e2}
        side={THREE.DoubleSide}
        flatShading
        dithering
        map={obstructionTexture}
      />
    </mesh>
  );
}

function PolygonObstruction({ obstruction: obs }) {
  const eavePoints = obs.nodes;
  const { shape, maxDepth } = useMemo(() => {
    const shapePoints = [];
    let maxDepth = 0;
    for (let i = 0; i < eavePoints.length; i++) {
      const pt1 = eavePoints[i];

      shapePoints.push(new THREE.Vector2(pt1.x, pt1.y));
      if (pt1.z > maxDepth) {
        maxDepth = pt1.z;
      }
    }
    return { shape: new THREE.Shape(shapePoints), maxDepth };
  }, []);

  return (
    <mesh>
      <extrudeBufferGeometry
        attach="geometry"
        args={[
          shape,
          {
            steps: 1,
            depth: maxDepth,
            bevelEnabled: false,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 1,
          },
        ]}
      />
      <meshStandardMaterial
        attach="material"
        color={0x747474}
        flatShading
        dithering
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function Obstructions() {
  const {siteModel} = useStore();
  return (
    <>
      {Object.values(
        //@ts-ignore
        siteModel.drawing.state.models.rectangularObstructions
      ).map((obstruction, i) => (
        <RectangularObstruction
          key={i}
          obstruction={obstruction}
          siteModel={siteModel}
        />
      ))}
      {Object.values(
        //@ts-ignore
        siteModel.drawing.state.models.circularObstructions
      ).map((obstruction, i) => (
        <CircleObstruction key={i} obstruction={obstruction} />
        )
      )}
      {/* @ts-ignore */}
      {Object.values(siteModel.drawing.state.models.polygonObstructions).map(
        (obstruction, i) => (
          <PolygonObstruction key={i} obstruction={obstruction} />
        )
      )}
    </>
  );
}
