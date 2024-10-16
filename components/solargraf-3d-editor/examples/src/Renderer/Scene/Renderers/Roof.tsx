import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import earcut from "earcut";
import { computeUVs } from "../../utils";
import { surfaceIsEnabledForPanels } from "./utils";
import { useStore } from "../context/SolargrafDesignContext";
import { useMapTexture } from "./AerialMap";
import { simplifyEdges } from "./edgeSimplification";
import { Line } from "@react-three/drei";
import { observer } from "mobx-react-lite";

export function Roof({ roof, roofOutline, onClick }) {
  const meshRef = useRef(null);
  const { mode, roofColors, siteModel, store } = useStore();
  const { mapTexture, gammaCorrection } = useMapTexture({});

  const [needsUpdate, setNeedsUpdate] = useState(new Date().getTime());

  // console.log({ highlightColor: store.highlightColor });

  const panelAndRoofStatus = store.designData.panelAndRoofStatus;


  const isSelected =
    mode === "roofs" && panelAndRoofStatus.roofs[roof.id]?.isEnabled;

  // useMemo(() => {
  //   return mode === "roofs" && panelAndRoofStatus.roofs[roof.id]?.isEnabled;
  // }, [mode, panelAndRoofStatus.roofs, roof.id]);


  const setIsSelected = //useCallback(
    () => {
      if (mode === "roofs") {
        console.log("setIsSelected", roof.id, panelAndRoofStatus.roofs[roof.id].isEnabled);
        panelAndRoofStatus.roofs[roof.id].isEnabled = !panelAndRoofStatus.roofs[roof.id].isEnabled;
        // console.log({
        //   panelAndRoofStatus: JSON.stringify(panelAndRoofStatus.roofs[roof.id]),
        // });
        // update the 3d view
        // _setIsSelected(_isSelected);
        setNeedsUpdate(new Date().getTime());
      }
    }
  //, [panelAndRoofStatus.roofs, roof.id]);

  // console.log({ mode: mode, isSelected: isSelected });

  const { roofGeometry, roofTexture, anchorPosition } = useMemo(() => {
    const roofGeometry = new THREE.BufferGeometry();
    const vertices = roof.order.reduce((sum: number[], edgeInOrder: { id: string | number; inverted: any; startElevation: any; endElevation: any; }) => {
      const edge = roofOutline.edges[edgeInOrder.id];
      const [startVertex, endVertex] = [
        roofOutline.vertices[edge.start],
        roofOutline.vertices[edge.end],
      ];
      const [start, end] = edgeInOrder.inverted
        ? [endVertex, startVertex]
        : [startVertex, endVertex];

      const pushVertex = (vert: { position: { x: string; y: string; }; elevations: { [x: string]: string; }; }, elevation: string | number) => {
        const posX = parseFloat(vert.position.x);
        const posY = parseFloat(vert.position.y);
        const elev = parseFloat(vert.elevations[elevation]);
        sum.push(posX, -posY, elev);
      };

      pushVertex(start, edgeInOrder.startElevation);
      pushVertex(end, edgeInOrder.endElevation);
      return sum;
    }, []);

    // Simplify the edges
    const simplifiedVertices = simplifyEdges(vertices, 0.1); // Adjust tolerance as needed

    const indices = earcut(simplifiedVertices, null, 3);
    roofGeometry.setIndex(indices);
    roofGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(simplifiedVertices, 3)
    );
    roofGeometry.computeVertexNormals();

    let roofTexture = null;
    if (mapTexture) {
      roofTexture = mapTexture.clone();
      // @ts-ignore
      roofTexture.encoding = THREE.sRGBEncoding;
      // @ts-ignore
      roofTexture.colorSpace = THREE.SRGBColorSpace;
      roofTexture.needsUpdate = true;

      const metersPerPx = siteModel.metersPerPixelRatio;
      const bbox = new THREE.Box3().setFromBufferAttribute(
        // @ts-ignore
        roofGeometry.attributes.position
      );
      const widthMeters = Math.abs(bbox.max.x - bbox.min.x);
      const heightMeters = Math.abs(bbox.max.y - bbox.min.y);

      const scaleX = (roofTexture.image.width * metersPerPx) / widthMeters;
      const scaleY = (roofTexture.image.width * metersPerPx) / heightMeters;
      const center = new THREE.Vector3();
      bbox.getCenter(center);

      roofTexture.repeat.set(1 / scaleX, 1 / scaleY);
      roofTexture.offset.set(
        0.5 +
        (center.x - widthMeters / 2) / metersPerPx / roofTexture.image.width,
        0.5 +
        (center.y - heightMeters / 2) / metersPerPx / roofTexture.image.width
      );
    }

    computeUVs(roofGeometry);

    // Calculate the highest point of the roof
    const positionAttribute = roofGeometry.attributes.position;
    let highestPoint = -Infinity;

    for (let i = 0; i < positionAttribute.count; i++) {
      const z = positionAttribute.getZ(i);
      if (z > highestPoint) {
        highestPoint = z;
      }
    }

    // Use the center x and y, but set z to be slightly above the highest point
    const anchorPosition = new THREE.Vector3(
      0,
      0,
      highestPoint + 0.5 // Add a small offset to ensure it's above the highest point
    );

    return { roofGeometry, roofTexture, anchorPosition };
  }, [roof, roofOutline, mapTexture, siteModel.metersPerPixelRatio]);

  const panelsEnabled =
    mode === "roofs" && surfaceIsEnabledForPanels(siteModel, roof.id);

  const roofColor = useMemo(() => {
    return mode === "roofs"
      ? roofColors[roof.id % roofColors.length]
      : undefined;
  }, [mode, roofColors, roof.id]);

  useFrame(() => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      if (mode === "roofs" && isSelected) {
        material.color.setStyle(store.highlightColor);
        material.opacity = 0.5;
      } else {
        material.color.setStyle(roofColor || "#cccccc");
        material.opacity = 1;
      }
      material.needsUpdate = true;
    }
  });

  const handleClick = (event: { stopPropagation: () => void; }) => {
    if (mode === "roofs") {
      console.log("Roof handleClick", event);
      event.stopPropagation();
      //@ts-ignore
      if (panelsEnabled) setIsSelected(!isSelected);
      if (onClick) {
        onClick();
      }
    }
  };

  const outlinePoints = useMemo(() => {
    const points = [];
    const positionAttribute = roofGeometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      //@ts-ignore
      points.push(
        new THREE.Vector3().fromBufferAttribute(positionAttribute, i)
      );
    }
    // Close the loop
    //@ts-ignore
    points.push(points[0].clone());
    return points;
  }, [roofGeometry]);

  return (
    <group>
      <mesh ref={meshRef} geometry={roofGeometry} onClick={handleClick}>
        <meshBasicMaterial
          attach="material"
          map={roofTexture}
          color={roofTexture ? 0xcccccc : 0xcccccc}
          side={THREE.DoubleSide}
          // transparent={true}
          opacity={1}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {panelsEnabled && (
        <Line
          points={outlinePoints}
          color={store.highlightColor}
          lineWidth={isSelected ? 6 : 2}
          dashed={false}
        />
      )}
      {/* {mode === "roofs" && (
        <group position={anchorPosition}>
          <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
            <Text
              color="#000000"
              fontSize={0.5}
              maxWidth={10}
              lineHeight={1}
              letterSpacing={0.02}
              textAlign="center"
              font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
              anchorX="center"
              anchorY="middle"
              position={[0, 0.5, 0]}
            >
              {`Roof ${roof.id}`}
            </Text>
          </Billboard>
        </group>
      )} */}
    </group>
  );
}

export default observer(Roof);
