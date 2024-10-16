// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import Offset from "polygon-offset";

// Setup CameraControls

// const Quaternion = THREE.Quaternion;

import React, { useContext, useEffect, useRef } from "react";
import Scene from "./Scene";
import {
  SolargrafDesignContext,
  SolarGrafDesignDataProvider,
} from "./Scene/context/SolargrafDesignContext";
//@ts-ignore

import { Canvas, ThreeElements, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { IRendererMode, SolargrafDesignContextType } from "./Scene/types";
import { extend, Object3DNode } from "@react-three/fiber";
import { observer } from "mobx-react-lite";
import { ModelDataStore } from "../ModelDataStore";

function ProjectRenderer({ disableControls }: any) {
  return (
    <Scene
      disableControls={disableControls}
    />
  );
}

export const keyBy = (array: any, key: string | number) =>
  (array || []).reduce(
    (r: any, x: { [x: string]: any }) => ({ ...r, [key ? x[key] : x]: x }),
    {}
  );

export interface InitialThreeDesignerState {
  features?: SolargrafDesignContextType["features"];
  disableControls?: boolean;
  mode?: IRendererMode;
  designData?: any;
  onPanelStatusChange?: any;
  onRoofStatusChange?: any;
  roofColors?: any;
  metersPerPixelRatio?: any;
  style?: any;
  defaultCameraPosition?: any;
  cameraPosition?: any;
  baseImageUrl?: any;
  hidePanelsBorders?: any;
  treesOpacity?: any;
  showObstructions?: any;
  projectDataOverride?: any;
  panelImage: string;
  store: ModelDataStore;
  highlightColor?: string;
}

export function ThreeDesigner({
  features,
  disableControls,
  mode,
  designData,
  onPanelStatusChange,
  onRoofStatusChange,
  roofColors,
  metersPerPixelRatio,
  style,
  cameraPosition,
  baseImageUrl,
  hidePanelsBorders,
  treesOpacity,
  projectDataOverride,
  panelImage,
  store,
  defaultCameraPosition,
  highlightColor
}: InitialThreeDesignerState) {
  const [projectData, setProjectData] = React.useState(projectDataOverride);
  React.useEffect(() => {
    if (designData?.drawingMetadataUrl || designData?.drawingMetadata) {
      setProjectData(designData.drawingMetadata);
    } else {
    }
  }, [designData?.drawingMetadataUrl]);

  const canvasRef = useRef();

  useEffect(() => {
    try {
      //@ts-ignore
      const ctx = canvasRef?.current?.getContext("3d");

      const handleResize = (e: any) => {
        ctx.canvas.height = window.innerHeight;
        ctx.canvas.width = window.innerWidth;
      };

      handleResize(null);
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    } catch (e) {}
  }, []);

  console.log("STORE: ComponentWrapper", { store });
  return (
    <>
      <Canvas
        ref={canvasRef}
        camera={{
          fov: 30,
          near: 1,
          far: 5000,
          position: !cameraPosition
            ? new THREE.Vector3(0, 90, mode == "roofs" ? 0 : 90)
            : new THREE.Vector3(
                cameraPosition.x,
                cameraPosition.y,
                cameraPosition.z
              ),
        }}
        style={style || { width: 550, height: 550 }}
      >
        <SolarGrafDesignDataProvider
          hidePanelsBorders={hidePanelsBorders}
          designId={designData.id}
          roofColors={roofColors}
          disableControls={disableControls}
          treesOpacity={treesOpacity}
          features={features}
          store={store}
          mode={mode}
          siteModel={{
            drawing: projectData,
            panelImage: panelImage,
            //@ts-ignore
            imageUrl:
              baseImageUrl ||
              //@ts-ignore
              (mode == "heatmap"
                ? designData.heatmapImageUrl
                : designData.baseImageUrl),
            metersPerPixelRatio: metersPerPixelRatio,
            buildings: []
          }}
          buildings={[]}
          panelAndRoofStatus={designData.panelAndRoofStatus}
          onPanelStatusChange={onPanelStatusChange}
          onRoofStatusChange={onRoofStatusChange}
          defaultCameraPosition={defaultCameraPosition}
          highlightColor={highlightColor}
        >
          <ProjectRenderer disableControls={disableControls} />
        </SolarGrafDesignDataProvider>
      </Canvas>
    </>
  );
}

export default observer(ThreeDesigner);
