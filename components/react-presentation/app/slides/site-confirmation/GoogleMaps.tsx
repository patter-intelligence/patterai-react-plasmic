/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  useLayoutEffect,
  FormEvent,
} from "react";
import debounce from "lodash/debounce";
import { Input } from "../../components/ui/input";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import "react-quill/dist/quill.snow.css";
import "react-quill/dist/quill.snow.css";
import ErrorBoundary from "./ErrorBoundary";
import StreetView from "./StreetView";
import CustomToggle from "./CustomToggle";
import * as Yup from "yup";
import { observer } from "@legendapp/state/react";
import { appState } from "../../state/appState";
import { useDirectSalesforceAction } from "../../hooks/useSalesforceOperations";

import Loader from "../../components/Loader";

// import ReactQuill from "react-quill"; // this document and causes build errors
// const ReactQuill = dynamic(import('react-quill'), {
//   ssr: false,
//   loading: () => <p>Loading ...</p>,
//   })

const libraries: ("places" | "marker" | "geocoding")[] = [
  "places",
  "marker",
  "geocoding",
];

const stateToCodeMap: { [key: string]: string } = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

const getStateCode = (state: string): string => {
  return stateToCodeMap[state] || state;
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

const defaultZoom = 20;

const addressSchema = Yup.object().shape({
  street: Yup.string().required("Street is required"),
  city: Yup.string().required("City is required"),
  state: Yup.string().required("State is required"),
  zip: Yup.string()
    .required("ZIP code is required")
    .matches(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  country: Yup.string().required("Country is required"),
});

interface GoogleMapsProps {
  apiKey: string;
  mapId: string;
}

export default observer(({ apiKey, mapId }: GoogleMapsProps) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [activeTab, setActiveTab] = useState("ADDRESS");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  //@ts-ignore
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isAddressLoaded, setIsAddressLoaded] = useState(false);
  const [isAddressLoadedFromSalesforce, setIsAddressLoadedFromSalesforce] =
    useState(false);
  const [isInitialMapLoadComplete, setIsInitialMapLoadComplete] =
    useState(false);
  const [isPinTabFirstLoad, setIsPinTabFirstLoad] = useState(true);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null
  );
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [previousZoom, setPreviousZoom] = useState<number | undefined>(
    undefined
  );

  const [existingSolar, setExistingSolar] = useState(false);
  const [groundMount, setGroundMount] = useState(false);
  const [newBuild, setNewBuild] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [designRequest, setDesignRequest] = useState({
    Notes__c: "",
    Id: "",
    Status__c: "",
    Project_Id__c: "",
    Design_Id__c: "",
  });

  const recordId = appState.recordId.get();

  const { result: salesforceAddress, refetch: getAddress } =
    useDirectSalesforceAction(
      "SiteService.getAddressFromSalesforce",
      {
        salesOpportunityId: recordId,
      },
      false
    );

  const { refetch: updateAddress } = useDirectSalesforceAction(
    "SiteService.updateAddressInSalesforce",
    {
      salesOpportunityId: recordId,
    },
    false
  );

  // Notes__c
  const { refetch: updateDesignRequest } = useDirectSalesforceAction(
    "DesignRequestService.updateDesignRequest",
    {
      salesOpportunityId: recordId,
    }
  );

  const { refetch: getDesignRequest } = useDirectSalesforceAction(
    "DesignRequestService.getDesignRequestBySID",
    {
      salesOpportunityId: recordId,
    }
  );

  // useEffect to get the address from Salesforce and set the initial state
  useLayoutEffect(() => {
    getAddress()
      .then(
        (sfAddress: {
          street: any;
          city: any;
          state: any;
          postalCode: any;
          country: any;
          latitude: any;
          longitude: any;
          hasExistingSolar: any;
          hasGroundMount: any;
          isNewBuild: any;
        }) => {
          console.log("sfAddress", sfAddress);
          setAddress({
            street: sfAddress.street,
            city: sfAddress.city,
            state: sfAddress.state,
            zip: sfAddress.postalCode,
            country: sfAddress.country,
          });
          const newPosition = {
            lat: sfAddress.latitude,
            lng: sfAddress.longitude,
          };
          setMarkerPosition(newPosition);

          setExistingSolar(sfAddress.hasExistingSolar);
          setGroundMount(sfAddress.hasGroundMount);
          setNewBuild(sfAddress.isNewBuild);

          // get the designer notes
          getDesignRequest({
            salesOpportunityId: recordId,
          })
            .then((designReq: any) => {
              setDesignRequest(designReq);
            })
            .catch((error) => {
              console.error("Error fetching design request:", error);
              // Set a default value for designRequest if there's an error
              setDesignRequest({
                Notes__c: "",
                Id: "",
                Status__c: "",
                Project_Id__c: "",
                Design_Id__c: "",
              });
            });

          // Update marker position
          if (mapRef.current && markerRef.current) {
            mapRef.current.panTo(newPosition);
            markerRef.current.position = newPosition;
          }

          // Delay setting the loaded states
          setTimeout(() => {
            setIsAddressLoaded(true);
            setIsAddressLoadedFromSalesforce(true);
          }, 100);
        }
      )
      .catch((error: any) => {
        console.error("Error fetching address:", error);
        // Delay setting the loaded states even on error
        setTimeout(() => {
          setIsAddressLoaded(true);
          setIsAddressLoadedFromSalesforce(true);
        }, 100);
      });
  }, [recordId]);

  const handleSite = (name: string, checked: boolean) => {
    switch (name) {
      case "Existing_Solar__c":
        setExistingSolar(checked);
        break;
      case "Ground_Mount__c":
        setGroundMount(checked);
        break;
      case "New_Build__c":
        setNewBuild(checked);
        break;
    }

    updateAddress({
      salesOpportunityId: recordId,
      address: {
        street: address.street,
        city: address.city,
        state: getStateCode(address.state),
        postalCode: address.zip,
        country: address.country,
        latitude: markerPosition.lat,
        longitude: markerPosition.lng,
        hasExistingSolar:
          name === "Existing_Solar__c" ? checked : existingSolar,
        hasGroundMount: name === "Ground_Mount__c" ? checked : groundMount,
        isNewBuild: name === "New_Build__c" ? checked : newBuild,
      },
    });
  };

  const debouncedUpdateDesignRequest = useMemo(
    () =>
      debounce((notes: string) => {
        console.log("Debounced function called with notes:", notes);
        if (designRequest.Id) {
          console.log("Updating design request with ID:", designRequest.Id);
          updateDesignRequest({
            salesOpportunityId: recordId,
            designRequestId: designRequest.Id,
            notes: notes,
            status: designRequest.Status__c,
            projectId: designRequest.Project_Id__c,
            designId: designRequest.Design_Id__c,
          });
        } else {
          console.log("No design request ID available");
        }
      }, 500),
    [recordId, designRequest.Id]
  );

  const handleDesignerNotes = useCallback(
    (content: string) => {
      console.log("handleDesignerNotes called with:", content);
      setDesignRequest((prev) => {
        console.log("Updating local state with notes:", content);
        return { ...prev, Notes__c: content };
      });
      if (designRequest && designRequest.Id) {
        debouncedUpdateDesignRequest(content);
      } else {
        console.warn("Cannot update design request: No valid ID");
      }
    },
    [recordId, designRequest]
  );

  useEffect(() => {
    return () => {
      debouncedUpdateDesignRequest.cancel();
    };
  }, [debouncedUpdateDesignRequest]);

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng && mapRef.current && markerRef.current) {
        const newPosition = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setMarkerPosition(newPosition);
        markerRef.current.position = newPosition;
        const currentZoom = mapRef.current.getZoom();
        mapRef.current.panTo(newPosition);
        mapRef.current.setZoom(currentZoom || defaultZoom);
        updateAddress({
          salesOpportunityId: recordId,
          address: {
            ...address,
            latitude: newPosition.lat,
            longitude: newPosition.lng,
            hasExistingSolar: existingSolar,
            hasGroundMount: groundMount,
            isNewBuild: newBuild,
          },
        });
      }
    },
    [recordId, address, existingSolar, groundMount, newBuild, updateAddress]
  );

  // Remove the updateAddressFromLatLng function as it's no longer needed

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      setIsMapLoaded(true);

      map.setOptions({
        mapId: mapId,
        mapTypeId: "satellite",
        streetViewControl: false,
        mapTypeControl: false,
        tilt: 0,
      });

      const updateMarker = () => {
        if (
          globalThis.google &&
          globalThis.google.maps &&
          globalThis.google.maps.marker
        ) {
          if (markerRef.current) {
            markerRef.current.map = null;
          }
          const advancedMarker =
            new globalThis.google.maps.marker.AdvancedMarkerElement({
              map,
              position: markerPosition,
              gmpDraggable: true,
            });
          markerRef.current = advancedMarker;

          advancedMarker.addListener(
            "dragend",
            (event: google.maps.MapMouseEvent) => {
              if (event.latLng) {
                handleMarkerDragEnd(event);
              }
            }
          );
        }
      };

      updateMarker();

      const initialZoom = activeTab === "PIN" ? 22 : defaultZoom;
      map.setZoom(initialZoom);
      map.panTo(markerPosition);

      // Force a re-render to ensure the zoom change takes effect
      setTimeout(() => {
        const currentCenter = map.getCenter();
        if (currentCenter) {
          map.panTo(currentCenter);
        }
        updateMarker();
        setIsInitialMapLoadComplete(true);
      }, 100);
    },
    [markerPosition, mapId, activeTab, handleMarkerDragEnd]
  );

  const getAddressComponent = (
    components: google.maps.GeocoderAddressComponent[],
    type: string
  ) => {
    const component = components.find((comp) => comp.types.includes(type));
    return component ? component.long_name : "";
  };

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touchedFields, setTouchedFields] = useState<{
    [key: string]: boolean;
  }>({});

  const validateField = (name: string, value: string) => {
    try {
      addressSchema.validateSyncAt(name, { [name]: value });
      setErrors((prev) => ({ ...prev, [name]: "" }));
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        setErrors((prev) => ({ ...prev, [name]: error.message }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    const geocoder = new globalThis.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        updateAddressFromPlace(results[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const streetInput = document.getElementById("street") as HTMLInputElement;
      if (streetInput && !autocompleteRef.current) {
        const autocomplete = new globalThis.google.maps.places.Autocomplete(
          streetInput,
          {
            types: ["address"],
            fields: ["address_components", "geometry", "name"],
          }
        );
        autocompleteRef.current = autocomplete;

        const placeChangedListener = autocomplete.addListener(
          "place_changed",
          () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location && mapRef.current) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const newPosition = { lat, lng };
              setMarkerPosition(newPosition);
              mapRef.current.panTo(newPosition);
              mapRef.current.setZoom(defaultZoom);
              updateAddressFromPlace(place);

              if (markerRef.current) {
                markerRef.current.position = newPosition;
              }
            }
          }
        );

        return () => {
          if (placeChangedListener) {
            globalThis.google.maps.event.removeListener(placeChangedListener);
          }
          if (autocompleteRef.current) {
            autocompleteRef.current = null;
          }
        };
      }
    }
  }, [isLoaded]);

  const updateAddressFromPlace = useCallback(
    (place: google.maps.places.PlaceResult) => {
      const addressComponents = place.address_components || [];
      const state = getAddressComponent(
        addressComponents,
        "administrative_area_level_1"
      );
      const newAddress = {
        street: `${getAddressComponent(
          addressComponents,
          "street_number"
        )} ${getAddressComponent(addressComponents, "route")}`,
        city: getAddressComponent(addressComponents, "locality"),
        state: getStateCode(state),
        zip: getAddressComponent(addressComponents, "postal_code"),
        country: getAddressComponent(addressComponents, "country"),
      };
      setAddress(newAddress);
      if (place.geometry && place.geometry.location) {
        updateAddress({
          salesOpportunityId: recordId,
          address: {
            street: newAddress.street,
            city: newAddress.city,
            state: newAddress.state,
            postalCode: newAddress.zip,
            country: newAddress.country,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            hasExistingSolar: existingSolar,
            hasGroundMount: groundMount,
            isNewBuild: newBuild,
          },
        });
      }
    },
    [recordId, existingSolar, groundMount, newBuild, updateAddress]
  );

  const memoizedStreetView = useMemo(() => {
    return <StreetView apiKey={apiKey} markerPosition={markerPosition} />;
  }, [apiKey, markerPosition]);

  const currentStep = appState.currentStepIndex.get();

  const handleNextStep = () => {
    if (activeTab === "ADDRESS") {
      if (validateAddressTab()) {
        setActiveTab("PIN");
        if (mapRef.current) {
          const newZoom = 22;
          mapRef.current.setZoom(newZoom);
          mapRef.current.panTo(markerPosition);
        }
        eventEmitter.emit("nextStep", appState.currentStepIndex.get(), appState.currentSlide.get());
      }
    } else if (activeTab === "PIN") {
      setActiveTab("DETAILS");
      if (mapRef.current) {
        mapRef.current.setZoom(defaultZoom);
      }
      eventEmitter.emit("nextStep", appState.currentStepIndex.get(), appState.currentSlide.get());
    } else if (activeTab === "DETAILS") {
      if (validateDetailsTab()) {
        updateAddress({
          salesOpportunityId: recordId,
          address: {
            street: address.street,
            city: address.city,
            state: getStateCode(address.state),
            postalCode: address.zip,
            country: address.country,
            latitude: markerPosition.lat,
            longitude: markerPosition.lng,
            hasExistingSolar: existingSolar,
            hasGroundMount: groundMount,
            isNewBuild: newBuild,
          },
        });
        setShowModal(true);
        eventEmitter.emit("nextStep", appState.currentStepIndex.get(), appState.currentSlide.get());
      }
    }
  };

  const validateAddressTab = () => {
    const allTouched = Object.keys(address).reduce(
      (acc, key) => {
        acc[key as keyof typeof address] = true;
        return acc;
      },
      {} as {
        [key in keyof typeof address]: boolean;
      }
    );
    setTouchedFields(allTouched);

    try {
      addressSchema.validateSync(address, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const newErrors: { [key: string]: string } = {};
        err.inner.forEach((error) => {
          if (error.path) {
            newErrors[error.path] = error.message;
          }
        });
        setErrors(newErrors);
        displayValidationMessages(newErrors);
      }
      return false;
    }
  };

  const validateDetailsTab = () => {
    // Add any specific validation for the DETAILS tab here
    // For now, we'll just return true
    return true;
  };

  const displayValidationMessages = (errors: { [key: string]: string }) => {
    Object.values(errors).forEach((error) => {
      toast.error(error, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    });
  };

  // useEffect to read the current step from the state and set the active tab
  useEffect(() => {
    const steps = appState.currentSlide.get().steps.map((step) => step.name);

    if (currentStep !== undefined) {
      setActiveTab(steps[currentStep]);
    }
  }, [currentStep]);

  // Register event listener for nextStep
  useEffect(() => {
    const handleNextStepEvent = () => {
      handleNextStep();
    };

    eventEmitter.on("nextStep", handleNextStepEvent);

    return () => {
      eventEmitter.off("nextStep", handleNextStepEvent);
    };
  }, [activeTab, address, markerPosition, existingSolar, groundMount, newBuild]);

  const ReactQuill = useRef();

  // Load quill dynamically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ReactQuill.current = require('react-quill')
      // const Size = ReactQuill.import('attributors/style/size')
      // Size.whitelist = fontSizeArr
      // ReactQuill.register(Size, true)
    }
  }, [])

  return (
    <ErrorBoundary>
      <motion.div
        className="sc-container"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <motion.div className="sc-map-section" variants={slideUp}>
          <ErrorBoundary>
            <motion.div
              key="map"
              className="sc-google-map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {isLoaded && isAddressLoaded && isAddressLoadedFromSalesforce ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={markerPosition}
                  zoom={defaultZoom}
                  onLoad={onMapLoad}
                >
                  {/* AdvancedMarkerElement is created in onMapLoad */}
                  {activeTab === "PIN" && (
                    <div
                      className="sc-map-mask"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <div
                        className="sc-map-mask-window"
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    </div>
                  )}
                </GoogleMap>
              ) : (
                <Loader
                  contextVariables={{
                    LOADER_LOGO:
                      "https://patter-demos-mu.vercel.app/Patter_Logo.png",
                    COMPANY_NAME: "Patter AI",
                  }}
                ></Loader>
              )}
            </motion.div>
          </ErrorBoundary>
        </motion.div>
        <motion.div className="sc-info-section" variants={slideUp}>
          <ErrorBoundary>
            <motion.div
              className="sc-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.h1
                className="sc-confirm-title h1-semi fade-in heading"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {activeTab === "PIN" && "Your placement"}
                {activeTab === "ADDRESS" && "Your home"}
                {activeTab === "DETAILS" && "Your details"}
              </motion.h1>
              {isAddressLoadedFromSalesforce && memoizedStreetView}
              <div className="sc-address-tabs">
                <button
                  className={`sc-tab-button ${
                    activeTab === "ADDRESS" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("ADDRESS");
                    appState.currentStepIndex.set(0); // TODO: this should be set globally and not here
                    if (mapRef.current) {
                      mapRef.current.setZoom(defaultZoom);
                    }
                  }}
                >
                  ADDRESS
                </button>
                <button
                  className={`sc-tab-button ${
                    activeTab === "PIN" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("PIN");
                    appState.currentStepIndex.set(1); // TODO: this should be set globally and not here
                    if (mapRef.current) {
                      const currentZoom =
                        mapRef.current.getZoom() || defaultZoom;
                      const newZoom = Math.max(currentZoom, 22);
                      mapRef.current.setZoom(newZoom);
                      mapRef.current.panTo(markerPosition);
                    }
                    if (isPinTabFirstLoad) {
                      setIsPinTabFirstLoad(false);
                    }
                  }}
                >
                  PIN
                </button>
                <button
                  className={`sc-tab-button ${
                    activeTab === "DETAILS" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("DETAILS");
                    appState.currentStepIndex.set(2); // TODO: this should be set globally and not here
                    if (mapRef.current) {
                      mapRef.current.setZoom(defaultZoom);
                    }
                  }}
                >
                  DETAILS
                </button>
              </div>
              {activeTab === "ADDRESS" && (
                <motion.div
                  className="sc-address-content"
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                >
                  <div className="sc-address-field">
                    <label
                      htmlFor="street"
                      className="sc-d2-medium sc-light-grey"
                    >
                      My address
                    </label>
                    <Input
                      id="street"
                      name="street"
                      value={address.street}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full ${
                        errors.street
                          ? "invalid"
                          : address.street
                          ? "valid"
                          : ""
                      }`}
                    />
                    {errors.street && (
                      <p className="sc-validation-text">{errors.street}</p>
                    )}
                  </div>
                  <motion.div
                    className="sc-address-row"
                    variants={slideUp}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="sc-address-field">
                      <label htmlFor="city" className="d2-medium light-grey">
                        City
                      </label>
                      <Input
                        id="city"
                        name="city"
                        value={address.city}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full ${
                          errors.city ? "invalid" : address.city ? "valid" : ""
                        }`}
                      />
                      {errors.city && (
                        <p className="validation-text">{errors.city}</p>
                      )}
                    </div>
                    <div className="sc-address-field">
                      <label htmlFor="state" className="d2-medium light-grey">
                        State
                      </label>
                      <Input
                        id="state"
                        name="state"
                        value={address.state}
                        onChange={handleInputChange}
                        className={`w-full ${errors.state ? "invalid" : ""}`}
                      />
                      {errors.state && (
                        <p className="validation-text">{errors.state}</p>
                      )}
                    </div>
                    <div className="sc-address-field">
                      <label htmlFor="zip" className="d2-medium light-grey">
                        Zip
                      </label>
                      <Input
                        id="zip"
                        name="zip"
                        value={address.zip}
                        onChange={handleInputChange}
                        className={`w-full ${errors.zip ? "invalid" : ""}`}
                      />
                      {errors.zip && (
                        <p className="validation-text">{errors.zip}</p>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
              {activeTab === "PIN" && (
                <div className="sc-pin-instructions">
                  <div className="sc-section-title sc-d2-medium sc-grey">
                    Confirm pin placement
                  </div>
                  <p className="sc-d2-medium sc-light-grey">
                    Use the map on the left to adjust the pin location. The
                    highlighted area shows the precise location.
                  </p>
                  <p className="sc-d2-medium sc-light-grey">
                    Press confirm when you're satisfied with the placement.
                  </p>
                </div>
              )}
              {activeTab === "DETAILS" && (
                <motion.div
                  className="sc-details-section"
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                >
                  <h2 className="sc-section-title sc-d2-medium sc-light-grey">
                    Site Details
                  </h2>
                  <div className="sc-toggle-group">
                    <CustomToggle
                      id="existing-solar"
                      checked={existingSolar}
                      onChange={(checked) =>
                        handleSite("Existing_Solar__c", checked)
                      }
                      label="Existing Solar"
                    />
                    <CustomToggle
                      id="ground-mount"
                      checked={groundMount}
                      onChange={(checked) =>
                        handleSite("Ground_Mount__c", checked)
                      }
                      label="Ground Mount"
                    />
                    <CustomToggle
                      id="new-build"
                      checked={newBuild}
                      onChange={(checked) =>
                        handleSite("New_Build__c", checked)
                      }
                      label="New Build"
                    />
                    <div className="sc-notes-field">
                      <label
                        htmlFor="designer-notes"
                        className="sc-d2-medium sc-light-grey sc-designer-notes"
                      >
                        <div>Notes for designer</div>
                        <div
                          style={{
                            color:
                              designRequest.Status__c === "Complete"
                                ? "green"
                                : "orange",
                            textAlign: "right",
                          }}
                        >
                          {designRequest.Status__c}
                        </div>
                      </label>
                    {ReactQuill.current &&
                      <ReactQuill.current
                        id="designer-notes"
                        theme="snow"
                        value={designRequest?.Notes__c || ""}
                        onChange={(content) => handleDesignerNotes(content)}
                        placeholder="Enter any additional notes for the designer..."
                      />}
                    </div>
                  </div>
                </motion.div>
              )}
              {/*<div className="sc-button-controls">
                <motion.button
                  className="sc-confirm-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  onClick={handleConfirmButton}
                >
                  CONFIRM
                </motion.button>
              </div>*/}
              <AnimatePresence>
                {showModal && (
                  <motion.div
                    className="sc-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="sc-modal"
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                    >
                      <h2>Details Confirmed</h2>
                      <p>Your site details have been successfully saved.</p>
                      <button onClick={() => setShowModal(false)}>Close</button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </ErrorBoundary>
        </motion.div>
      </motion.div>
    </ErrorBoundary>
  );
});
