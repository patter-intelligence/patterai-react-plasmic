import React, { useContext, useMemo, useCallback, useRef } from "react";
import {
  extend,
  useLoader,
  //@ts-ignore
  ThreeElements,
  useThree,
  useFrame,
} from "@react-three/fiber";
import * as THREE from "three";
import {
  LineSegments2,
  LineMaterial,
  LineSegmentsGeometry,
} from "three-stdlib";
import {
  SolargrafDesignContext,
  useStore,
} from "../context/SolargrafDesignContext";
//@ts-ignore
import { ISiteModel, IPanelArray, IPanel, IRoof } from "../types";
import { observer } from "mobx-react-lite";

extend({ LineSegments2, LineMaterial });

function useOnPointerTap(onTap: () => void) {
  const dragged = React.useRef(false);
  const onPointerDown = useCallback(() => {
    dragged.current = false;
  }, []);
  const onPointerMove = useCallback(() => {
    dragged.current = true;
  }, []);
  const onPointerUp = useCallback(() => {
    if (!dragged.current) {
      onTap();
    }
  }, [onTap]);

  return { onPointerDown, onPointerUp, onPointerMove };
}

interface ModuleProps {
  roof: IRoof;
  panel: IPanel;
  panelArray: IPanelArray;
  roofOutline: any; // Consider creating a type for roofOutline
}

const Module: React.FC<ModuleProps> = observer(
  ({ roof, panel, panelArray, roofOutline }) => {
    const { siteModel, onPanelStatusChange, hidePanelsBorders } = useContext(
      SolargrafDesignContext
    );
    const store = useStore();

    const enabled = store.store.designData.panelAndRoofStatus.panels[panel.id]?.isEnabled;



    // console.log("Module:", { enabled })

    //@ts-ignore
    const [panelTexture] = useLoader(THREE.TextureLoader, [
      //@ts-ignore
      siteModel.panelImage,
    ]);
    panelTexture.wrapS = THREE.RepeatWrapping;
    panelTexture.wrapT = THREE.RepeatWrapping;
    panelTexture.repeat.set(3, 3);
    panelTexture.rotation = -Math.PI;

    const handleTap = (() => {
      const allPanels = Object.values(
        siteModel.drawing.state.models.panelArrays
      ).flatMap((pa: any) => Object.values(pa.panels));
      const panelIndex = allPanels.findIndex(
        (_panel: IPanel) => _panel.id === panel.id
      );

      if (panelIndex !== -1) {
        onPanelStatusChange({
          panelIndex,
          status: enabled,
          panelId: panel.id,
        });
      }
    })//, [panel.id, store]);

    const meshTapEvents = useOnPointerTap(handleTap);

    const panelGeometry = useMemo(
      () =>
        new THREE.BoxGeometry(
          panelArray.panelWidth,
          panelArray.panelHeight,
          0.04
        ),
      [panelArray.panelWidth, panelArray.panelHeight]
    );

    const lineGeometry = useMemo(() => {
      const panelEdges = new THREE.EdgesGeometry(panelGeometry);
      return new LineSegmentsGeometry().setPositions(
        //@ts-ignore
        panelEdges.attributes.position.array
      );
    }, [panelGeometry]);

    const pitchInRadians = (roof.pitch * Math.PI) / 180;
    const azimuthInRadians = (roof.azimuth * Math.PI) / 180;

    return (
      <group
        rotation={[
          Math.cos(azimuthInRadians + Math.PI) * pitchInRadians + Math.PI,
          Math.sin(azimuthInRadians + Math.PI) * pitchInRadians + Math.PI,
          -azimuthInRadians,
        ]}
        position={[panel.position.x, -panel.position.z, panel.position.y]}
      >
        <mesh
          {...meshTapEvents}
          visible={enabled}
          position={[0, panelArray.panelHeight / 2, 0.02]}
        >
          <boxGeometry
            args={[panelArray.panelWidth, panelArray.panelHeight, 0.02]}
          />
          <meshPhysicalMaterial
            attach="material"
            side={THREE.DoubleSide}
            roughness={0.005}
            metalness={0.1}
            clearcoat={0.98}
            clearcoatRoughness={0.005}
            map={panelTexture}
            color={enabled ? 0xffffff : 0xaaaaaa}
            envMapIntensity={7}
          />
        </mesh>
        {!hidePanelsBorders && (
          //@ts-ignore
          <lineSegments2
            args={[lineGeometry]}
            position={[0, panelArray.panelHeight / 2, 0.02]}
          >
            {/* @ts-ignore */}
            <lineMaterial
              attach="material"
              color={0xffffff}
              linewidth={enabled ? 2 : 1.3}
              resolution={[window.innerWidth, window.innerHeight]}
            />
            {/* @ts-ignore */}
          </lineSegments2>
        )}
      </group>
    );
  }
);

interface ModulesProps {
  // siteModel: ISiteModel;
}

const Modules: React.FC<ModulesProps> = () => {
  const store = useStore();
  const { siteModel } = store;
  const roofOutlines: any[] = Object.values(
    siteModel.drawing.state.models.roofOutlines || {}
  );

  const roofSections = useMemo(
    () =>
      roofOutlines.reduce((acc: any, roofOutline: any) => {
        for (const roof of Object.values(roofOutline.sections)) {
          //@ts-ignore
          acc[roof.id] = { outline: roofOutline, section: roof };
        }
        return acc;
      }, {}),
    [roofOutlines]
  );

  const panelArrays: IPanelArray[] = Object.values(
    siteModel.drawing.state.models.panelArrays || {}
  );
  const panelSettings = store.store.designData.panelAndRoofStatus;
  const selectedRoofs = Object.keys(panelSettings.roofs).filter((key) => panelSettings.roofs[key].isEnabled);


  // console.log("Modules:", JSON.stringify({ panelArrays, panelSettings, selectedRoofs }));


  // filter panelArrays to only those that are selected i.e const isSelected =    mode === "roofs" && panelAndRoofStatus.roofs[roof.id]?.isEnabled;
  const selectedPanelArrays = panelArrays.filter((panelArray) => {

    return selectedRoofs.includes(panelArray.roofSectionId);
  }
  );

  return (
    <>
      {selectedPanelArrays.map((panelArray: IPanelArray) => (
        <React.Fragment key={panelArray.id}>
          {Object.values(panelArray.panels || {}).map((panel: IPanel) => (
            <Module
              key={panel.id}
              roof={roofSections[panelArray.roofSectionId].section}
              roofOutline={roofSections[panelArray.roofSectionId].outline}
              panel={panel}
              panelArray={panelArray}
            />
          ))}
        </React.Fragment>
      ))}
    </>
  );
};

export default React.memo(Modules);
