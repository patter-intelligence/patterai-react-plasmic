import React, { Suspense, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { SketchPicker } from "react-color";
import SolargrafRenderer from "./Renderer/ThreeDesigner";
import { ModelDataStore } from "./ModelDataStore";
import { ROOF_COLORS } from "./ROOF_COLORS";

interface AppProps {
  store: ModelDataStore;
  onPanelStatusChanged: ({
    panelId,
    panelEnabled,
    panels,
  }: {
    panelId: any;
    panelEnabled: any;
    panels: any;
  }) => void;
  onRoofStatusChanged: ({
    roofId,
    roofEnabled,
    roofs,
  }: {
    roofId: any;
    roofEnabled: any;
    roofs: any;
  }) => void;
  onRenderLoaded: (data: any) => void;
}

const App: React.FC<AppProps> = observer(({ store, onPanelStatusChanged, onRoofStatusChanged, onRenderLoaded }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const { design: solargrafDesign, loading, highlightColor } = store;

  useEffect(() => {
    if (solargrafDesign) {
      if (!store.designData?.id) {
        store.generateDesignData();
      }
      onRenderLoaded?.({ designData: store.designData });
    } else {
      store.generateDesignData();
    }
  }, [solargrafDesign, store, onRenderLoaded]);

  const handlePanelStatusChange = ({
    panelIndex,
    status,
    panelId,
  }: {
    panelIndex?: any,
    status: any,
    panelId: any
  }) => {
    if (!solargrafDesign.panels) solargrafDesign.panels = [];


    if (panelId.panelId) {
      panelId = panelId.panelId;
      status = panelId.status;
    }

    const panelEnabledStatus = !status;
    const panel = solargrafDesign.panels.find((p: { id: string; }) => p.id === panelId);

    console.log("handlePanelStatusChange", panelId, status, panel, panelEnabledStatus);


    if (!panel) {
      solargrafDesign.panels.push({ id: panelId, isEnabled: true });
    } else {
      panel.isEnabled = panelEnabledStatus;
    }

    store.updatePanelEnabledStatus(panelId, panelEnabledStatus);

    onPanelStatusChanged?.({
      panelId,
      panelEnabled: panelEnabledStatus,
      panels: solargrafDesign.panels,
    });
  };

  const handleRoofStatusChange = ({ roofId, roofIndex, status }: { roofId: any; roofIndex: any; status: any; }): void => {
    console.log("handleRoofStatusChange", { roofId, roofIndex, status });
    const roofEnabledStatus = status;
    const roof = solargrafDesign.roofs.find((r: { id: string; }) => r.id === roofId);
    if (!roof) {
      solargrafDesign.roofs.push({ id: roofId, isEnabled: true });
    } else {
      roof.isEnabled = roofEnabledStatus
    }

    onRoofStatusChanged?.({
      roofId,
      roofEnabled: roofEnabledStatus,
      roofs: solargrafDesign.roofs,
    });
    // store.updateRoofEnabledStatus(roofId, roofEnabledStatus);

  };
  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
    }}>
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            width: "100%",
            backgroundColor: "#CFD4D6",
            color: "black",
            position: "absolute",
          }}
        >
          <div style={{ backgroundColor: "#CFD4D6", width: "100vw", height: "100vh", position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }} />
        </div>
      )}

      {/* <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1000,
          minWidth: "300px",
          minHeight: "100px",
        }}
      >
        <button onClick={() => setShowColorPicker(!showColorPicker)}>
          {showColorPicker ? "Hide" : "Show"} Color Picker
        </button>
        {showColorPicker && (
          <div style={{ position: "absolute", zIndex: 2 }}>
            <SketchPicker
              color={highlightColor}
              onChange={(color) => store.setHighlightColor(color.hex)}
            />
          </div>
        )}
      </div> */}

      {solargrafDesign && (
        <SolargrafRenderer
          style={{ backgroundColor: "white" }}
          defaultCameraPosition={[0, 50, 70]}
          cameraPosition={{
            x: 45,
            y: 90,
            z: store.mode === "2D" ? 0 : 90,
          }}
          features={{
            treesEnabled: true,
            obstructionsEnabled: true,
            roofColorsEnabled: true,
          }}
          store={store}
          designData={store.designData}
          roofColors={ROOF_COLORS}
          metersPerPixelRatio={solargrafDesign.metersPerPixelRatio}
          panelImage={
            solargrafDesign.panelImage ||
            "https://fyqqwknvbyngkbhofnfv.supabase.co/storage/v1/object/public/patter-ai-static-assets/textures/panelImage.png"
          }
          mode={store.mode}
          disableControls={false} //{store.mode === "2D"}
          onPanelStatusChange={handlePanelStatusChange}
          projectDataOverride={solargrafDesign.drawingMetadata}
          onRoofStatusChange={handleRoofStatusChange}
          highlightColor={highlightColor}
        />
      )}
    </div>
  );
});


function encodeToBase64(obj) {
  return btoa(JSON.stringify(obj));
}

// Function to decode base64 to object
function decodeFromBase64(str) {
  return JSON.parse(atob(str));
}

// IndexedDB setup
const dbName = "SolargrafCache";
const dbVersion = 1;
const objectStoreName = "proposals";
let __browser__cache__;

// Function to initialize IndexedDB
function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      __browser__cache__ = event.target.result;
      console.log("IndexedDB opened successfully");
      resolve();
    };

    request.onupgradeneeded = (event) => {
      __browser__cache__ = event.target.result;
      const objectStore = __browser__cache__.createObjectStore(objectStoreName, { keyPath: "id" });
      objectStore.createIndex("updatedAt", "updatedAt", { unique: false });
    };
  });
}

// Function to get data from IndexedDB
function getFromCache(projectId, proposalId) {
  return new Promise((resolve, reject) => {
    if (!projectId || !proposalId) {
      reject("Both projectId and proposalId must be provided");
      return;
    }
    const cacheKey = `${projectId}_${proposalId}`;
    const transaction = __browser__cache__.transaction([objectStoreName], "readonly");
    const objectStore = transaction.objectStore(objectStoreName);
    const request = objectStore.get(cacheKey);

    request.onerror = (event) => {
      reject("Error fetching from cache");
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };
  });
}

// Function to save data to IndexedDB
function saveToCache(projectId, proposalId, data) {
  return new Promise((resolve, reject) => {
    const cacheKey = `${projectId}_${proposalId}`;
    const transaction = __browser__cache__.transaction([objectStoreName], "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    const request = objectStore.put({
      id: cacheKey,
      ...data
    });

    request.onerror = (event) => {
      reject("Error saving to cache");
    };

    request.onsuccess = (event) => {
      resolve();
    };
  });
}

// Function to limit cache size
async function limitCacheSize() {
  const transaction = __browser__cache__.transaction([objectStoreName], "readwrite");
  const objectStore = transaction.objectStore(objectStoreName);
  const countRequest = objectStore.count();

  countRequest.onsuccess = async (event) => {
    const count = event.target.result;
    if (count > 5) {
      const cursor = objectStore.index("updatedAt").openCursor();
      let deletedCount = 0;

      cursor.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && deletedCount < count - 5) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };
    }
  };
}
const store_ = new ModelDataStore();


export const PatterCADModel = observer((
  { height = 600, width = 600,
    projectId = "2457905", proposalId = "17abe974-586b-4570-a866-63008ebdfeb8",
    panelAndRoofStatusBase64 = btoa(JSON.stringify({ "panels": [], "roofs": [] })),
    mode = "roofs",
    onPanelStatusChanged, onRoofStatusChanged, onRenderLoaded

  }) => {



  // get the project id, proposal id, and panelAndRoofStatus from the URL
  const urlParams = new URLSearchParams(window.location.search);
  // const projectId = "2457905";
  // const proposalId = "17abe974-586b-4570-a866-63008ebdfeb8"
  // const panelAndRoofStatusBase64 = btoa(JSON.stringify({ "panels": [], "roofs": [] })) // 
  // console.log({
  //   projectId,
  //   proposalId,
  //   panelAndRoofStatusBase64,
  // });

  const [store, setStore] = React.useState<ModelDataStore>(null);

  useEffect(() => {

    async function startup() {

      await initIndexedDB();

      getFromCache(projectId, proposalId)
        .then(cachedData => {
          return fetch(`https://compute-workercdnendpoint2296bea0.azureedge.net/api/solargraf/proposals/${projectId}`)
            .then(response => response.json())
            .then(proposalData => {
              const currentProposal = proposalData.find(p => p.id === proposalId);
              return { cachedData, currentProposal };
            });
        })
        .then(({ cachedData, currentProposal }) => {
          if (cachedData && cachedData.updatedAt === currentProposal.updatedAt) {
            console.log("Using cached data");
            return cachedData.data;
          } else {
            console.log("Fetching fresh data");
            const apiUrl = new URL(
              "https://compute-workercdnendpoint2296bea0.azureedge.net/api/solargraf/data-for-renderer"
            );
            apiUrl.searchParams.append("projectId", projectId);
            apiUrl.searchParams.append("proposalId", proposalId);

            return fetch(apiUrl)
              .then(response => response.text())
              .then(data => {
                const dataLocal = JSON.parse(data);
                return saveToCache(projectId, proposalId, {
                  updatedAt: currentProposal.updatedAt,
                  data: dataLocal
                }).then(() => limitCacheSize()).then(() => dataLocal);
              });
          }
        })
        .then(dataLocal => {
          // Hide loading spinner and show renderer
          //loadingContainer.style.display = "none";
          // solargrafRenderer.style.display = "block";

          // Always load panelAndRoofStatus from URL parameter
          if (panelAndRoofStatusBase64) {
            dataLocal.initialDesign.panelAndRoofStatus = decodeFromBase64(
              panelAndRoofStatusBase64
            );
          }

          let parsedInitialData: any = {};
          let design = {};
          if (dataLocal === undefined) {
            console.log("initialData is undefined");
          } else {
            try {
              const t0 = performance.now();
              parsedInitialData = dataLocal;//JSON.parse(dataLocal);

              parsedInitialData.design = design;
              store_.parsedInitialData = parsedInitialData;
              store_.height = height;
              store_.width = width;
              store_.loadingMessage = parsedInitialData.loadingMessage;
              console.log(
                "parsedInitialData",
                parsedInitialData,
                "in ",
                performance.now() - t0,
                "ms"
              );
              setStore(store_)
              // store.generateDesignData();

              // window.initializeSolarGrafRenderer({
              //   initialData: dataLocal,
              //   rootElement: solargrafRenderer,
              //   onPanelStatusChanged: (data) => {
              //     console.log("onPanelStatusChanged:", JSON.stringify(data));

              //     const message = JSON.stringify({
              //       type: "panelStatusChanged",
              //       data: data,
              //     });
              //     window.parent && window.parent.postMessage(message, "*");
              //   },
              //   height: 600,
              //   width: 600,
              //   onRendererReady: () => {
              //     // This callback will be called when the renderer is ready
              //     solargrafRenderer.classList.add("loaded");
              //   },
              // });

              // Add a safe fallback timeout for the fade-in effect
              // setTimeout(() => {
              //   solargrafRenderer.classList.add("loaded");
              // }, 50);
            }
            catch (e) {
              console.error(e);
            }
          }


        })
    }

    startup();


  }, [proposalId, projectId, panelAndRoofStatusBase64]);

  useEffect(() => {
    if (store) {
      store.mode = mode;
    }
  }, [mode, store])



  if (!store) {
    return <div style={{ backgroundColor: "white", width: "100vw", height: "100vh", position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }} />
  }

  return (
    <Suspense fallback={<div style={{ backgroundColor: "white", width: "100vw", height: "100vh", position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }} />}>
      <App
        store={store}
        onPanelStatusChanged={onPanelStatusChanged}
        onRenderLoaded={onRenderLoaded}
        onRoofStatusChanged={onRoofStatusChanged}
      />
    </Suspense>
  );
});

export default App;
