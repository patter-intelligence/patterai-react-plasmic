/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from "react";
import ReactDOM from "react-dom/client";
import PatterCADModel from "./App";
// import "./index.css";
import { ModelDataStore } from "./ModelDataStore";
// import testCombinedData from "./testCombinedData.ts";

// const initialData = document.querySelector('.initialdatasolargraf').textContent;

// console.log('initialData', initialData)

import { polygonArea } from "./polygon3d";
import * as turfHelpers from "@turf/helpers";
import _ from "lodash";
interface Edge {
  id: string | number;
  inverted: boolean;
  roofEdgeType: any; // Replace 'any' with proper type when known.
  endElevation: string | number;
  startElevation: string | number;
}

interface RoofSection {
  id?: string | number; // Replace 'any' with proper type when known.
  pitch: number; // Replace 'any' with proper type when known.
  azimuth: number; // Replace 'any' with proper type when known.
}

interface Vertex {
  position: { x: number; y: number };
  elevations: Record<string, any>; // Replace 'any' with proper type when known.
}

interface RoofOutline {
  id: string | number;
  sections: Record<string, Section> & Record<string, RoofSection>;
  edges: Record<string, any>; // Replace 'any' with proper type when known.
  vertices: Record<string, Vertex>;
}

interface DesignRoof {
  id?: string | number; // Replace 'any' with proper type when known.
  isEnabled: boolean;
  typeId: any; // Replace 'any' with proper type when known.
}

interface Section {
  id?: string | number;
  order: Edge[];
}

interface IRoofPlane {
  id?: string | number;
  isEnabled: boolean;
  typeId: any; // Replace 'any' with proper type when known.
}

interface IPanel {
  id?: string | number;
  isEnabled: boolean;
}

interface SectionEdge {
  id: string | number;
  startElevation: string | number;
  endElevation: string | number;
}

// import defaultDesign from "../cache.json";

const keyBy = (array: any, key: string | number) =>
  (array || []).reduce(
    (r: any, x: { [x: string]: any }) => ({ ...r, [key ? x[key] : x]: x }),
    {}
  );

export function generateDesignFromSolargrafParts(
  projectId: any,
  proposalId: any,
  drawingMetadata: any,
  projectDrawings: any[],
  projectProductionData: any[],
  publicProjectRes: {
    RoofPlanes: IRoofPlane[] | { Panel: any }[];
    Panels: IPanel[];
    meter_per_pixel_ratio: any;
    publicImage: string;
  }
) {
  const projectShadingReports = []; //await sgApiClient.getShadingReports(projectId, proposalId);

  // console.error("projectShadingReports", projectShadingReports);
  const projectShadingReport = _.sortBy(
    projectShadingReports,
    "createdAt"
  ).reverse()?.[0];
  let drawing = projectDrawings.find(
    (drawing: { attributes: { proposal_id: string } }) =>
      drawing.attributes.proposal_id == proposalId
  );

  if (!drawing) {
    // hack for now
    drawing = projectDrawings[0];
  }

  console.error("drawing", drawing);
  let projectProduction = projectProductionData.find(
    (project: { proposalId: number }) => project.proposalId == proposalId
  );

  // hack for now
  if (!projectProduction) projectProduction = projectProductionData[0];
  // const drawingMetadata: any = await fetch(drawing.attributes.metadataUrl).then(
  //   (res) => res.json()
  // );
  const roofOutlines: any = Object.values(
    drawingMetadata.state.models.roofOutlines
  );
  const panelArrays: any = Object.values(
    drawingMetadata.state.models.panelArrays
  );
  //@ts-ignore
  const designPanel: any = publicProjectRes.RoofPlanes?.[0]?.Panel;

  function getSurfaceSqft(roofOutline: RoofOutline, section: Section) {
    const vertices: any = section.order.map(
      (sectionEdge: {
        id: string | number;
        inverted: any;
        endElevation: string | number;
        startElevation: string | number;
      }) => {
        const edge = roofOutline.edges[sectionEdge.id];
        const startVertex = roofOutline.vertices[edge.start];
        const endVertex = roofOutline.vertices[edge.end];
        if (sectionEdge.inverted) {
          return [
            endVertex.position.x,
            endVertex.position.y,
            endVertex.elevations[sectionEdge.endElevation],
          ];
        } else {
          return [
            startVertex.position.x,
            startVertex.position.y,
            startVertex.elevations[sectionEdge.startElevation],
          ];
        }
      }
    );
    const areaInSquareMeters = polygonArea(vertices);
    return turfHelpers.convertArea(areaInSquareMeters, "meters", "feet");
  }

  const solargrafDesign = {
    //@ts-ignore
    roofs: publicProjectRes.RoofPlanes?.map((roof: IRoofPlane) => {
      return {
        id: roof.id,
        isEnabled: roof.isEnabled,
        typeId: roof.typeId,
      };
    }),
    panels: publicProjectRes.Panels?.map((panel: IPanel) => {
      return {
        id: panel.id,
        isEnabled: panel.isEnabled,
      };
    }),
  };

  const design = {
    designId: 1, // TODO: use actual design id
    projectId,
    drawingMetadataUrl: drawing.attributes.metadataUrl,
    drawingMetadata: drawingMetadata,
    heatmapImageUrl: projectShadingReport?.heatmapUrl,
    baseImageUrl: publicProjectRes.publicImage,
    panelImage: null,
    //  "https://corsproxy.io/?https://static-alpha.solargraf.com/project/satellite/51c8947d-c00e-4960-ae73-c09f00161ce4.png",
    metersPerPixelRatio: publicProjectRes.meter_per_pixel_ratio,
    energyProduction: {
      acAnnual: projectProduction.acAnnual,
      dcAnnual: projectProduction.dcAnnual,
      acMonthly: projectProduction.acMonthly,
      acHourly: projectProduction.acHourly,
    },
    materials: {
      ...(designPanel && {
        panel: {
          name: designPanel.name,
          sizeInWatts: designPanel.size_in_watts,
        },
      }),
    },
    roofs: roofOutlines.flatMap((roofOutline: RoofOutline) => {
      return Object.values(roofOutline.sections).map((section: any) => {
        const panelArray = panelArrays.find(
          (panelArray: { roofSectionId: any }) =>
            panelArray.roofSectionId == section.id
        );
        const elevations = extractElevationList(section, roofOutline);
        const lengthsByEdgeType = extractLengthsByEdgeType(
          section,
          roofOutline
        );
        const maxElevation = Math.min(...elevations);
        const sqFootage = getSurfaceSqft(roofOutline, section);
        const roof = solargrafDesign?.roofs?.find(
          (r: { id: any }) => r.id === section.id
        );
        return {
          id: section.id,
          buildingId: roofOutline.id,
          pitch: section.pitch,
          azimuth: section.azimuth,
          sqFootage,
          lengthByEdgeType: Object.entries(lengthsByEdgeType).map(
            ([edgeType, length]) => {
              let len = parseFloat(length as string);
              if (typeof length === "number") len = length;

              return {
                type: edgeType,
                lengthInFeet: turfHelpers.convertLength(len, "meters", "feet"),
              };
            }
          ),
          squares: Math.ceil(sqFootage / 100),
          stories: Math.max(1, maxElevation / 3),
          isEnabled: roof?.isEnabled || false,
          solarAccess: panelArray ? panelArray.solarAccessValue * 100 : 0,
          panelQty: Object.keys(panelArray?.panels || {}).length,
          typeId: roof?.typeId || undefined,
        };
      });
    }),
    panels: panelArrays.flatMap(
      (panelArray: {
        panels: { [s: string]: unknown } | ArrayLike<unknown>;
        roofSectionId: any;
      }) => {
        return Object.values(panelArray.panels).map((panel: any) => {
          return {
            id: panel.id,
            roofId: panelArray.roofSectionId,
            isEnabled:
              solargrafDesign?.panels?.find(
                (p: { id: any }) => p.id === panel.id
              )?.isEnabled || false,
          };
        });
      }
    ),
    updatedAt: new Date(),
  };

  console.log("generateDesignFromSolargrafParts: design", design);
  return design;
}

function extractLengthsByEdgeType(section: any, roofOutline: RoofOutline) {
  return section.order.reduce(
    (
      acc: { [x: string]: any },
      sectionEdge: { id: string | number; lengthInMeters: any }
    ) => {
      const edge = roofOutline.edges[sectionEdge.id];
      acc[edge.roofEdgeType] = acc[edge.roofEdgeType] || 0;
      acc[edge.roofEdgeType] += sectionEdge.lengthInMeters;
      return acc;
    },
    {}
  );
}

function extractElevationList(section: any, roofOutline: RoofOutline) {
  return section.order.flatMap((sectionEdge: SectionEdge) => {
    const edge = roofOutline.edges[sectionEdge.id];
    const startVertex = roofOutline.vertices[edge.start];
    const endVertex = roofOutline.vertices[edge.end];
    return [
      startVertex.elevations[sectionEdge.startElevation],
      endVertex.elevations[sectionEdge.endElevation],
    ];
  });
}

// import { observer } from "mobx-react-lite";

// const store = new ModelDataStore();

// const ObservableApp = observer(
//   ({
//     store,
//     onPanelStatusChanged,
//     onRenderLoaded,
//   }: {
//     store: ModelDataStore;
//     onPanelStatusChanged: (data: any) => void;
//     onRenderLoaded: () => void;
//   }) => {
//     return (
//       <PatterCADModel
//         store={store}
//         onPanelStatusChanged={onPanelStatusChanged}
//         onRenderLoaded={onRenderLoaded}
//       />
//     );
//   }
// );

// function mount({
//   initialData,
//   rootElement,
//   onPanelStatusChanged,
//   height,
//   width,
//   onRenderLoaded,
// }) {
//   let parsedInitialData: any = {};
//   let design = {};
//   if (initialData === undefined) {
//     console.log("initialData is undefined");
//   } else {
//     try {
//       const t0 = performance.now();
//       parsedInitialData = JSON.parse(initialData);

//       parsedInitialData.design = design;
//       store.parsedInitialData = parsedInitialData;
//       store.height = height;
//       store.width = width;
//       store.loadingMessage = parsedInitialData.loadingMessage;
//       console.log(
//         "parsedInitialData",
//         parsedInitialData,
//         "in ",
//         performance.now() - t0,
//         "ms"
//       );
//       // store.generateDesignData();
//     } catch (e) {
//       console.error(e);
//     }
//   }

//   try {
//     // const div_root = rootElement;
//     //@ts-ignore
//     window.PatterSolarGrafRoot?.unmount?.(); //React 18
//     // div_root.remove();
//   } catch (e) {
//     console.error(e);
//   }
//   //@ts-ignore
//   window.PatterSolarGrafRoot = ReactDOM.createRoot(rootElement!).render(
//     <React.StrictMode>
//       <ObservableApp
//         store={store}
//         onPanelStatusChanged={onPanelStatusChanged}
//         onRenderLoaded={onRenderLoaded}
//       />
//     </React.StrictMode>
//   );
// }

const updateDesign = (initialData: any) => {
  console.log("Loading new design", initialData);
  try {
    let parsedInitialData: any = {};

    parsedInitialData = JSON.parse(initialData);

    console.log("parsedInitialData", parsedInitialData);

    store.updateInitialData(parsedInitialData);
    store.generateDesignData();
  } catch (e) {
    console.error(e);
  }
};

const updatePanelAndRoofStatus = (data: any) => {
  console.log("updateRoofStatus", data);
  try {
    store.updatePanelAndRoofStatus(data);
  } catch (e) {
    console.error(e);
  }
};

// //@ts-ignore
// window.initializeSolarGrafRenderer = mount;
// //@ts-ignore
// window.updateDesign = updateDesign;
// //@ts-ignore
// window.PatterAIModuleSolarGraf = {
//   mount,
//   updateDesign,
//   updatePanelAndRoofStatus,
// };
// //@ts-ignore
// window.PatterAIModules = {
//   //@ts-ignore
//   ...window.PatterAIModules,
//   //@ts-ignore

//   Solargraf: window.PatterAIModuleSolarGraf,
// };

// export default {
//   mount,
//   updateDesign,
// };

// import testRawData from "./livedata.js";
// import testRawData from "./testRawData.js";

// import testDrawingMetadata from "./testDrawingMetadata.js";
// // import defaultDesign from "./defaultDesign.js"
