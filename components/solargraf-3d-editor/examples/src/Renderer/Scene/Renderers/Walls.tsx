import React from "react";
import { Edge } from "./Edge";
import { observer } from "mobx-react-lite";
import { useStore } from "../context/SolargrafDesignContext";

export const Walls = observer(function Walls({  }: any) {
  const { siteModel } = useStore();
  const roofOutlines = Object.values(
    siteModel.drawing.state.models.roofOutlines || {}
  );
  return roofOutlines.map((roofOutline: any) => {
    // @ts-ignore
    const roofs = Object.values(roofOutline.sections || {});
    return (
      // @ts-ignore
      <React.Fragment key={roofOutline.id}>
        {roofs.map((roof: any) => {
          return (
            // @ts-ignore
            <React.Fragment key={roof.id}>
              {roof.order.map((edgeInOrder: { id: string | number; }) => {
                const edge = roofOutline.edges[edgeInOrder.id];
                return (
                  <Edge
                    key={edge.id}
                    edge={edge}
                    vertices={roofOutline.vertices}
                    edgeInOrder={edgeInOrder} />
                );
              })}
            </React.Fragment>
          );
        })}
      </React.Fragment>
    );
  });
});
