import * as React from "react";
import { useEvents } from "./Events";
import { IElement, IGameStoreContext } from "./types";
import { v4 as uuid } from "uuid";
import { tToPixel, T_WORLD_RADIUS } from "@/settings";
import { AnchorPoint, ColonyPoint } from "@/store/types";
import TreeModel from "tree-model";

export const GameStoreContext = React.createContext<IGameStoreContext>({
  fungiTree: undefined,
  selectedFungus: undefined,
  anchorPoints: [],
  addRoot: () => {},
  setSelectedFungus: () => {},
});

const rootAnchorPointUid = uuid();
export function useGame() {
  return React.useContext(GameStoreContext);
}

export function GameStore(props: React.PropsWithChildren<{}>) {
  const [treeRerenderKey, setTreeRerenderKey] = React.useState(0);
  const fungiTree = React.useMemo(() => new TreeModel(), []);

  const rootNode = React.useMemo(
    () =>
      fungiTree.parse<ColonyPoint>({
        id: rootAnchorPointUid,
        t: 0,
        x: 0,
        y: 0,
        territoryType: "colonyPoint",
        fungusType: "colony",
        rootPoints: 10,
        hitPoints: 5,
        children: [],
      }),
    [fungiTree]
  );

  const { triggerEvent, subscribeEvent, unsubscribeEvent } = useEvents();

  const [selectedFungus, setSelectedFungus] =
    React.useState<TreeModel.Node<ColonyPoint> | null>(rootNode);

  const addRoot = React.useCallback(
    ({
      anchorPoint,
      parentNode,
    }: {
      anchorPoint: AnchorPoint;
      parentNode: TreeModel.Node<ColonyPoint>;
    }) => {
      const [x1, x2] = [parentNode.x, anchorPoint.x].sort();
      const expandCost = x2 - x1;
      const newRootPoints = Math.floor(
        (expandCost - parentNode.rootPoints) / 2
      );
      const newNode = fungiTree.parse({
        ...anchorPoint,
        fungusType: "colony",
        rootPoints: newRootPoints,
        hitPoints: 5,
      });
      parentNode.addChild(newNode);
      parentNode.rootPoints =
        parentNode.rootPoints - (expandCost + newRootPoints);
      console.log(
        "add has already happens, add thinks parentNode is:",
        parentNode
      );
      setTreeRerenderKey((o) => o + 1);
    },
    [fungiTree]
  );

  const anchorPoints = React.useMemo(() => {
    const tentativePoints = new Array(T_WORLD_RADIUS).fill(0).map((_, i) => ({
      t: i - T_WORLD_RADIUS / 2,
      id: i === 0 ? rootAnchorPointUid : uuid(),
      x: tToPixel(i - T_WORLD_RADIUS / 2),
      y: 0,
      territoryType:
        i % 3 === 0 ? "colonyPoint" : i % 2 === 0 ? "desert" : "resource",
    }));
    return tentativePoints;

    // rangos de nodos del mismo "type" resource, que entonces tenene que mostrar solo un rect conjunto
    // return tentativePoints.filter(
    //   (p) => !elements.find((e) => e.t <= p.t && e.t + e.amount >= p.t)
    // );
  }, []);

  const contextValue = React.useMemo(
    () => ({
      treeRerenderKey,
      rootNode,
      fungiTree,
      selectedFungus,
      anchorPoints,
      addRoot,
      setSelectedFungus,
    }),
    [
      treeRerenderKey,
      rootNode,
      fungiTree,
      selectedFungus,
      anchorPoints,
      addRoot,
      setSelectedFungus,
    ]
  );

  return (
    <GameStoreContext.Provider value={contextValue}>
      {props.children}
    </GameStoreContext.Provider>
  );
}
