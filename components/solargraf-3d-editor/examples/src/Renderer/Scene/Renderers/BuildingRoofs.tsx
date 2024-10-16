import React, { useContext } from "react";
import { useMapTexture } from "./AerialMap";
import { SolargrafDesignContext, useStore } from "../context/SolargrafDesignContext";
import { getRoofColor } from "./utils";
import { Roof } from "./Roof";
import { observer } from "mobx-react-lite";

export const BuildingRoofs = observer(function BuildingRoofs({
}: any) {

  const store = useStore();
  const { siteModel } = store;

  //@ts-ignore
  const { mapTexture, gammaCorrection } = useMapTexture({ siteModel });
  const roofOutlines = Object.values(
    siteModel.drawing.state.models.roofOutlines || {}
  );
  const { mode, roofColors, panelAndRoofStatus, onRoofStatusChange } =
    useContext(SolargrafDesignContext);
  const roofSettings = panelAndRoofStatus.roofs;
  let roofIndex = -1;

  return roofOutlines.map((roofOutline: any) => {
    // @ts-ignore
    const roofs = Object.values(roofOutline.sections || {});
    return (
      <React.Fragment key={roofOutline.id}>
        {roofs.map(
          (roof: {
            id: any;
            roofOutlineId: any;
            order: any[];
            roofGeometry: any;
            roofTexture: any;
            roofColor: any;
          }) => {
            roofIndex += 1;
            return (
              <Roof
                key={roof.id}
                roof={roof}
                roofOutline={roofOutline}
                //@ts-ignore
                mapTexture={mapTexture}
                siteModel={siteModel}
                enabled={
                  //@ts-ignore
                  roofSettings[roof.id]?.isEnabled &&
                  (mode === "roofs" || mode === "panels")
                }
                roofColor={
                  // mode === "roofs"
                  //   ? getRoofColor(roofColors, roofIndex % 6)
                  //   : 
                  undefined
                }
                onClick={() => {
                  if (mode === "roofs") {
                    let buffRoofs: any[] = [];
                    Object.values(
                      siteModel.drawing.state.models.roofOutlines
                    ).forEach((outline: any) => {
                      Object.values(outline.sections).forEach((section) => {
                        buffRoofs.push(section);
                      });
                    });
                    const roofIndex = buffRoofs.findIndex(
                      (r) => r.id === roof.id
                    );
                    onRoofStatusChange({
                      roofId: roof.id,
                      roofIndex: roofIndex,
                      //@ts-ignore
                      status: !!roofSettings[roof.id]?.isEnabled,
                    });
                  }
                }}
              />
            );
          }
        )}
      </React.Fragment>
    );
  });
});
