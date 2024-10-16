import { ModelDataStore } from "../../ModelDataStore";

export type ISiteModel = {
  metersPerPixelRatio: number;
  panelImage: string;
  imageUrl: string;
  drawing: {
    state: {
      models: {
        panelArrays: any[];
        roofOutlines: any[];
      };
    };
  };
  buildings: any[];
};

export type ISolarGrafTree = {
  position: { x: any; z: any; y: any };
  trunkHeight: any;
  trunkRadius: any;
  crownHorizontalRadius: any;
  crownVerticalRadius: any;
};

export type IRendererMode = "2D" | "roofs" | "panels";

export type SolargrafDesignContextType = {
  disableControls: any;
  treesOpacity: any;
  hidePanelsBorders: any;
  mode: IRendererMode;
  features?: {
    treesEnabled: boolean;
    obstructionsEnabled: boolean;
    roofColorsEnabled: boolean;
  };
  roofColors: any;
  siteModel: ISiteModel;
  highlightColor: string;
  buildings: any[];
  panelAndRoofStatus: {
    roofs: {
      [key: string]: {
        selected: boolean;
        color: string;
      };
    };
    panels: {
      [key: string]: {
        selected: boolean;
        color: string;
      };
    };
  };
  designId: any;
  onPanelStatusChange: any;
  onRoofStatusChange: any;
  store: ModelDataStore;
  defaultCameraPosition: [number, number, number];
};
