/* eslint-disable @typescript-eslint/no-explicit-any */
import { action, makeAutoObservable, toJS } from "mobx";
import { generateDesignFromSolargrafParts } from "./main";
import * as THREE from "three";

const keyBy = (array: any, key: string | number) =>
  (array || []).reduce(
    (r: any, x: { [x: string]: any }) => ({ ...r, [key ? x[key] : x]: x }),
    {}
  );

export class ModelDataStore {
  parsedInitialData: {
    projectId: string | number;
    proposalId: string | number;
    initialDesign: any;
    projectProductionData: any;
    projectDrawings: any;
    publicProject: any;
  } = {} as any;
  height = 550;
  width = 550;
  loadingMessage = "Loading 3D Model...";
  mode = "roofs";
  highlightColor: string = "#7DF9FF";
  design: any;
  designData: {
    id: string | number;
    drawingMetadataUrl: string;
    drawingMetadata: any;
    heatmapImageUrl: string;
    baseImageUrl: string;
    panelAndRoofStatus: {
      panels: { [x: string]: any };
      roofs: { [x: string]: any };
    };
  } = {} as any;
  loading = true;

  constructor() {
    makeAutoObservable(this);
  }

  changeMode = action((mode: string) => {
    this.mode = mode;
  });

  setHighlightColor = action((color: string) => {

    // const hexToRgb = (hex: string) => {
    //   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    //   return result ? {
    //     r: parseInt(result[1], 16),
    //     g: parseInt(result[2], 16),
    //     b: parseInt(result[3], 16)
    //   } : null;
    // };
    // // convert the color to whats compatible with threejs
    // const rgb = hexToRgb(color);
    this.highlightColor = color; //new THREE.Color(rgb.r, rgb.g, rgb.b);
    console.log({ highlightColor: this.highlightColor, color });
  });
  // generateDesign = action(() =>{
  //   this.design =  generateDesignFromSolargrafParts(
  //     this.parsedInitialData.projectId,
  //     this.parsedInitialData.proposalId,
  //     this.parsedInitialData.initialDesign.drawingMetadata,
  //     this.parsedInitialData.projectProductionData,
  //     this.parsedInitialData.projectDrawings,
  //     this.parsedInitialData.publicProject
  //   );
  // })

  generateDesignData = action(() => {
    this.loading = true;
    console.log("generateDesignData started", toJS(this.parsedInitialData));
    const t0 = performance.now();
    const design = generateDesignFromSolargrafParts(
      this.parsedInitialData.projectId,
      this.parsedInitialData.proposalId,
      this.parsedInitialData.initialDesign.drawingMetadata,
      this.parsedInitialData.projectDrawings,
      this.parsedInitialData.projectProductionData,
      this.parsedInitialData.publicProject
    );
    // console.error({pNR:this.parsedInitialData.initialDesign.panelAndRoofStatus})

    // lets process panelAndRoofStatus
    const processedPanelAndRoofStatus = {
      panels: keyBy(design.panels, "id"),
      roofs: keyBy(design.roofs, "id"),
    };

    if (this.parsedInitialData?.initialDesign?.panelAndRoofStatus) {
      // read isEnabled from initialDesign and update processedPanelAndRoofStatus
      const { panels, roofs } =
        this.parsedInitialData.initialDesign.panelAndRoofStatus;
      for (const panel of panels) {
        if (processedPanelAndRoofStatus.panels[panel.id])
          processedPanelAndRoofStatus.panels[panel.id].isEnabled =
            panel.isEnabled;
      }
      for (const roof of roofs) {
        if (processedPanelAndRoofStatus.roofs[roof.id])
          processedPanelAndRoofStatus.roofs[roof.id].isEnabled = roof.isEnabled;
      }
    }

    this.design = design;
    this.designData = {
      id: design.designId,
      drawingMetadataUrl: design.drawingMetadataUrl,
      drawingMetadata: design.drawingMetadata,
      heatmapImageUrl: design.heatmapImageUrl,
      baseImageUrl: design.baseImageUrl,
      panelAndRoofStatus: processedPanelAndRoofStatus,
    };

    console.log({ designData: this.designData });
    const t1 = performance.now();
    console.log("generateDesignData took " + (t1 - t0) + " milliseconds.");
    this.loading = false;
  });

  updatePanelEnabledStatus = action((id: string, enabled: boolean) => {
    console.warn("updatePanelEnabledStatus", id, enabled);
    this.designData.panelAndRoofStatus.panels[id].isEnabled = enabled;
  });

  updateRoofEnabledStatus = action((id: string, enabled: boolean) => {
    console.warn("updateRoofEnabledStatus", id, enabled);
    this.designData.panelAndRoofStatus.roofs[id].isEnabled = enabled;
  });

  updateInitialData = action((data: any) => {
    console.warn("updateInitialData", data);
    this.parsedInitialData = data;
    this.generateDesignData();
  });

  updatePanelAndRoofStatus = action((data: any) => {
    console.warn("updatePanelAndRoofStatus", data);
    this.designData.panelAndRoofStatus = data;
  });


}
