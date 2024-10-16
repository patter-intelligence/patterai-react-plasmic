import { DefaultLoadingManager } from "three";
import create from "zustand";

const useProgress = create((set:any) => {
  const prevOnStart = DefaultLoadingManager.onStart;
  const prevOnLoad = DefaultLoadingManager.onLoad;
  const prevOnProgress = DefaultLoadingManager.onProgress;
  const prevOnError = DefaultLoadingManager.onError;

  DefaultLoadingManager.onStart = (item, loaded, total) => {
    if (prevOnStart) prevOnStart(item, loaded, total);
        // @ts-ignore
    set({
      active: true,
      item,
      loaded,
      total,
      progress: (loaded / total) * 100,
    });
  };

  DefaultLoadingManager.onLoad = () => {
    if (prevOnLoad) prevOnLoad();
        // @ts-ignore
    set({ active: false });
  };

  DefaultLoadingManager.onError = (item) => {
    if (prevOnError) prevOnError(item);

    set((state) => ({ errors: [...state.errors, item] }));
  };
  DefaultLoadingManager.onProgress = (item, loaded, total) => {
    if (prevOnProgress) prevOnProgress(item, loaded, total);
    set({ item, loaded, total, progress: (loaded / total) * 100 });
  };

  return {
    errors: [],
    active: false,
    progress: 0,
    item: "",
    loaded: 0,
    total: 0,
  };
});

export { useProgress };
