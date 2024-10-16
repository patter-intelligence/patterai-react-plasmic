import React from "react";
import { SolargrafDesignContextType } from "../types";

export const SolargrafDesignContext =
  React.createContext<SolargrafDesignContextType>(null as any);

export function SolarGrafDesignDataProvider({
  disableControls,
  treesOpacity,
  hidePanelsBorders,
  mode,
  roofColors,
  siteModel,
  panelAndRoofStatus,
  designId,
  onPanelStatusChange = () => {},
  onRoofStatusChange = () => {},
  features,
  children,
  store,
  defaultCameraPosition,
  buildings,
  highlightColor,
}: SolargrafDesignContextType & { children: any }) {
  return (
    <SolargrafDesignContext.Provider
      value={{
        disableControls,
        features,
        treesOpacity,
        hidePanelsBorders,
        mode,
        roofColors,
        siteModel,
        panelAndRoofStatus,
        designId,
        onPanelStatusChange,
        onRoofStatusChange,
        store,
        defaultCameraPosition,
        buildings,
        highlightColor,
      }}
    >
      {children}
    </SolargrafDesignContext.Provider>
  );
}

export const useStore = () => React.useContext(SolargrafDesignContext);
