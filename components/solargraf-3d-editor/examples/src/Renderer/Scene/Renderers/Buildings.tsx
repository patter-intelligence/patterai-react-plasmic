import { Walls } from "./Walls";
import { BuildingRoofs } from "./BuildingRoofs";
import { useStore } from "../context/SolargrafDesignContext";
import { observer } from "mobx-react-lite";

export default observer(function Buildings({ }: any) {
  const { siteModel } = useStore();
  return (
    <>
      <BuildingRoofs />
      <Walls  />
    </>
  );
})