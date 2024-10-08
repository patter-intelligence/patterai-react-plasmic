/* eslint-disable @typescript-eslint/no-explicit-any */
import { observable, ObservableObject } from "@legendapp/state";

import { updateCurrentSlideUrl } from "../utilities/navigationUtils";
import { NavigateFunction } from "react-router-dom";
import { PanelOption, Roof, Section } from "../types";
import { enableReactComponents } from "@legendapp/state/config/enableReactComponents";
import { configureObservableSync } from "@legendapp/state/sync";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

// Enable the Reactive components, only need to do this once
enableReactComponents();

// Setup global persist configuration
configureObservableSync({
  persist: {
    plugin: ObservablePersistLocalStorage,
    retrySync: true,
  },
  debounceSet: 500,
  retry: {
    infinite: true,
  },
});

type AppState = {
  isMenuOpen: boolean;
  currentSlideIndex: number;
  highestVisitedSlideIndex: number;
  slides: { name: string; order: number }[];
  searchQuery: string;
  selectedGroup: string;
  selectedSection: string;
  isLoading: boolean;
  uploadProgress: Record<string, number>;
  isUploading: boolean;
  showImagePopup: boolean;
  selectedImageUrl: string;
  showDebugInfo: boolean;
  opportunityDetails: any;
  storageUsage: string;
  storageLimit: string;
  photoCaptureSections: { storedFiles: any[]; uploadProgress: number }[];
  hasStoredFiles: boolean;
  storedFiles: any[];
  salesforcePhotos: any[];
  showPhotoUploader: boolean;
  recordId: string;
  activeQuoteId: string;
  navigator: NavigateFunction | null;
  annualProduction: number;
  systemSize: number;
  numberOfModules: number;
  design: any;
  panelOptions: PanelOption[];
  solargraf3D: {
    status: "loading" | "ready" | "error";
    loadingProgress: number;
    projectId: string;
    currentProposal: { id: string } | null;
    roofs: Roof[];
  };
  projectId: string;
  currentProposal: {
    id: string;
    name: string;
  };
  salesOpportunityId: string;
  defaultProduct: any;
};

type ISlide = {
  name: string;
  order: number;
  steps: { name: string; description: string }[];
};

export const appState = observable({
  isMenuOpen: false,
  currentSlideIndex: 0,
  highestVisitedSlideIndex: 0,
  currentStepIndex: 0,
  slides: [] as ISlide[],
  searchQuery: "",
  selectedGroup: "General",
  selectedSection: "All",
  isLoading: false,
  uploadProgress: {} as Record<string, number>,
  isUploading: false,
  showImagePopup: false,
  selectedImageUrl: "",
  showDebugInfo: false,
  opportunityDetails: {} as any,
  storageUsage: "",
  storageLimit: "",
  photoCaptureSections: [] as Section[],
  hasStoredFiles: false,
  storedFiles: [] as any[],
  salesforcePhotos: [] as any[],
  showPhotoUploader: false,
  recordId: "",
  activeQuoteId: "",
  navigator: null as NavigateFunction | null,
  annualProduction: 0,
  offsetPercentage: 0,
  annualConsumption: 0,
  systemSize: 0,
  numberOfModules: 0,
  design: null as any,
  panelOptions: [] as PanelOption[],

  defaultProduct: null as any,
  projectId: null as string | null,
  currentProposal: null as {
    id: "";
    name: "";
  } | null,
  salesOpportunityId: "",
  presentationId: "",
  salesOpportunity: {} as any,
  currentProducts: {} as Record<
    string,
    { qualified: boolean; quantity: number }
  >,
  totalEnergyEfficiencyOffsetKWh: 0,
  totalEnergyEfficiencyOffset: 0,

  // get current slide using the currentSlideIndex
  currentSlide() {
    const slide = appState.slides.get()[appState.currentSlideIndex.get()];
    // if(slide.steps == undefined) {
    //   slide.steps = [];
    // }
    return slide;
  },

  toggleMenu: () => {
    appState.isMenuOpen.set(!appState.isMenuOpen.get());
  },
  setCurrentSlideIndex: (index: number) => {
    appState.currentSlideIndex.set(index);
    if (index > appState.highestVisitedSlideIndex.get()) {
      appState.highestVisitedSlideIndex.set(index);
    }
    // updateCurrentSlideUrl(appState.navigator.get(), index);
  },
  setNavigator: (navigate: NavigateFunction) => {
    appState.navigator.set(navigate);
  },
  setSlides: (slides: { name: string; order: number }[]) => {
    appState.slides.set(slides);
  },
  setSearchQuery: (query: string) => {
    appState.searchQuery.set(query);
  },
  setSelectedGroup: (group: string) => {
    appState.selectedGroup.set(group);
  },
  setIsLoading: (isLoading: boolean) => {
    appState.isLoading.set(isLoading);
  },
  updateUploadProgress: (fileId: string, progress: number) => {
    appState.uploadProgress[fileId].set(progress);
  },
  setIsUploading: (isUploading: boolean) => {
    appState.isUploading.set(isUploading);
  },
  setShowImagePopup: (show: boolean) => {
    appState.showImagePopup.set(show);
  },
  setSelectedImageUrl: (url: string) => {
    appState.selectedImageUrl.set(url);
  },
  toggleDebugInfo: () => {
    appState.showDebugInfo.set(!appState.showDebugInfo.get());
  },
  setUploadProgress: (progress: Record<string, number>) => {
    appState.uploadProgress.set(progress);
  },
  setSolargraf3DState: <K extends keyof AppState["solargraf3D"]>(
    newState: Partial<Record<K, AppState["solargraf3D"][K]>>
  ) => {
    Object.entries(newState).forEach(([key, value]) => {
      // @ts-ignore
      (appState.solargraf3D[key as K] as any).set(value);
    });
  },
});
