import React, {
  useState,
  useRef,
  useContext,
  useEffect,
  Suspense,
} from "react";
import * as THREE from "three";
import { useLoader, useThree } from "@react-three/fiber";
import Trees from "./Trees";
import Obstructions from "./Obstructions";
import Modules from "./Modules";
import Buildings from "./Buildings";
import AerialMap from "./AerialMap";
import {
  SolargrafDesignContext,
  useStore,
} from "../context/SolargrafDesignContext";
import CameraControls from "../Controls/CameraControls";

const LazyBuildings = React.lazy(() => import("./Buildings"));
const LazyTrees = React.lazy(() => import("./Trees"));
const LazyAerialMap = React.lazy(() => import("./AerialMap"));
const LazyModules = React.lazy(() => import("./Modules"));
const LazyObstructions = React.lazy(() => import("./Obstructions"));

function SiteModel({}) {
  const { mode, features, defaultCameraPosition, siteModel, disableControls } =
    useStore();
  const [initialCameraPosition, setInitialCameraPosition] = useState(
    defaultCameraPosition
  );
  const { camera } = useThree();

  useEffect(() => {
    if (siteModel && siteModel.buildings && siteModel.buildings.length > 0) {
      const bbox = new THREE.Box3();
      //@ts-ignore
      siteModel.buildings.forEach((building) => {
        const buildingGeometry = new THREE.BoxGeometry(
          building.width,
          building.height,
          building.depth
        );
        const buildingMesh = new THREE.Mesh(buildingGeometry);
        buildingMesh.position.set(building.x, building.y, building.z);
        bbox.expandByObject(buildingMesh);
      });

      const center = new THREE.Vector3();
      bbox.getCenter(center);

      const size = new THREE.Vector3();
      bbox.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z);
      //@ts-ignore
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5; // 1.5 times to ensure buildings are in view

      setInitialCameraPosition([
        center.x,
        center.y + maxDim / 2,
        center.z + cameraZ,
      ]);
    }
  }, [siteModel, camera]);
//<div style={{backgroundColor:"#CFD4D6", width:"100vw", height:"100vh"}}>
  return (
    <Suspense fallback={<AerialMap />}>
    <fog attach="fog" args={["#e0e5ee", 1, 1000]} />
      {/* {features?.treesEnabled ? <Trees  /> : null} */}
      <CameraControls
        // disable={!!disableControls}
        initialPosition={initialCameraPosition}
      />
      <Suspense fallback={<></>}>
        <LazyBuildings siteModel={siteModel} />
      </Suspense>
      <AerialMap />
      <Obstructions />
      {features?.treesEnabled ? <Trees /> : null}
      {/* {mode == "panels" && <Suspense fallback={<></>}>
        <LazyModules />
      </Suspense>} */}
       {(mode == "panels" || mode=="2D") && 
        <Modules />
      }
      {/* <Modules /> */}
      {/* 
      <Suspense fallback={<></>}>
        <LazyModules siteModel={siteModel} />
      </Suspense>
      <Suspense fallback={<></>}>
        <LazyObstructions siteModel={siteModel} />
      </Suspense>
      <Suspense fallback={<></>}>
        <LazyTrees siteModel={siteModel} />
      </Suspense>
          <Suspense fallback={<></>}>
        <LazyAerialMap />
      </Suspense>
      */}
  
    </Suspense>
  );
}

export default SiteModel;
