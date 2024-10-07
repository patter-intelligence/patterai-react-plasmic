/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState, Suspense } from "react";
import {
  PresentationRenderer,
  IPresentationSlides,
  ContextVariables,
} from "./PresentationRenderer";
import PresentationUtilityProfile from "../slides/utility-confirmation/PresentationUtilityProfile";
import PhotoUploader from "../slides/PhotoUploader";
import styles from "./Home.module.css";
import classNames from "classnames";
import "./PresentationStyles.module.css";
import { components } from "./ComponentsRegistry";
import Loader from "./Loader";
import SlideMenu from "./SlideMenu";
import { appState } from "../state/appState";
import { observer } from "@legendapp/state/react";
import { useRouter } from "next/router";
import {
  SalesforceProvider,
  useSalesforce,
} from "../providers/SalesforceProvider";
// import { ENERGY_EFFICIENCY_PRODUCTS } from '../slides/EnergyEfficiency';
import { updateCurrentSlideUrl } from "../utilities/navigationUtils";
import { parse } from "path";
import { MenuContainer } from "./MenuContainer";

const dataHooks = {
  additionalData: async (context: ContextVariables) => {
    // Simulating an API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { someExtraInfo: "This is additional data loaded asynchronously" };
  },
};

const contextVariables = {
  PATTER_SLIDE_STATIC_IMAGE: "/assets/PatterSlideStaticImage.png",
  COMPANY_LOGO: "https://patter-demos-mu.vercel.app/Patter_Logo.png",
  EXAMPLE_IFRAME_URL: "https://example.com",
  salesOpportunity: {
    Id: "12345",
  },
  LOADER_LOGO: "https://patter-demos-mu.vercel.app/Patter_Logo.png",
  COMPANY_NAME: "Patter AI",
};

export const Home: React.FC = observer(() => {
  const router = useRouter();
  const salesforce = useSalesforce();
  const [allSlides, setAllSlides] = useState<IPresentationSlides>({
    slides: [],
  });
  const [isComponentLoading, setIsComponentLoading] = useState(false);

  useEffect(() => {
    // Set initial loading state
    appState.setIsLoading(true);

    // Get current slide from query parameter
    const currentSlide = appState.presentationId.get(); //Number(router.query.currentSlide || 0);
    // if(!currentSlide) {
    //   appState.setCurrentSlideIndex(0);
    // }
    // appState.setCurrentSlideIndex(currentSlide);

    // check if there is presentationId in the query params
    const presentationId = appState.presentationId.get() as string;
    // if (presentationId) {
    //   appState.presentationId.set(presentationId);
    // }

    // Fetch presentation data
    const fetchPresentation = async () => {
      console.log("Fetching presentation data...");
      try {
        console.log("Current recordId:", appState.recordId.get());
        let presentationData;

        if (presentationId) {
          presentationData = await salesforce.getPresentationById(
            presentationId,
            appState.recordId.get()
          );
        } else {
          presentationData =
            await salesforce.getPresentationForSalesOpportunity(
              appState.recordId.get()
            );
        }
        // console.log('Raw presentation data:', presentationData);

        const parsedData = presentationData;

        // We need to parse the layout in each slide, since that is stored as a string
        parsedData.slides = parsedData.slides.map((slide: any) => {
          // console.log('Processing slide:', slide);
          // fix any urls that look like /resource/ to point to
          // slide.layout = slide.layout.replace(/\/resource\/\d{13}\//, '/assets/');
          // also remove any numbers like 1715119601000

          // Replace resource URLs, remove timestamps, and add .png extension if needed
          // slide.layout = slide.layout.replace(
          //   /(url\(["']?)?\/(?:resource|assets)\/(?:\d+\/)?([^"'\s)]+)(["']?\))?/g,
          //   (match: string, urlStart: string, path: string, urlEnd: string) => {
          //     const cleanPath = path.replace(/^\d+\//, ''); // Remove leading timestamp-like numbers
          //     const url = `/assets/${cleanPath}`;
          //     const newUrl = !/\.(png|jpg|jpeg|gif|svg)$/i.test(url) ? `${url}.png` : url;

          //     if (urlStart) {
          //       // It's a CSS url() function
          //       return `url("${newUrl}")`;
          //     } else {
          //       // It's a standalone URL
          //       return newUrl;
          //     }
          //   }
          // );

          // minor fixups for local, replace /resource/1715119601000/SunSolarReferralSlide with /assets/SunSolarReferralSlide.png
          slide.layout = slide.layout.replaceAll(
            "/resource/1715119601000/SunSolarReferralSlide",
            "/assets/SunSolarReferralSlide.png"
          );
          slide.layout = slide.layout.replaceAll(
            "/resource/1715123181000/SunSolarCostToDoNothing",
            "/assets/SunSolarCostToDoNothing.png"
          );
          // /resource/1717526838000/SunSolarLogo
          slide.layout = slide.layout.replaceAll(
            "/resource/1717526838000/SunSolarLogo",
            "https://patter-demos-mu.vercel.app/Patter_Logo.png"
          );

          slide.layout = slide.layout.replaceAll(
            "/resource/1717526927000/SunSolarLogo",
            "https://patter-demos-mu.vercel.app/Patter_Logo.png"
          );

          slide.layout = slide.layout.replaceAll(
            "/resource/1715122593000/SunSolarLogo",
            "https://patter-demos-mu.vercel.app/Patter_Logo.png"
          );

          slide.layout = slide.layout.replaceAll(
            "/resource/1716496456000/Solar_customers",
            "https://patter-demos-mu.vercel.app/Patter_Logo.png"
          );

          slide.layout = slide.layout.replaceAll(
            "/resource/1723241447000/sun_co_logo",
            "/assets/sun_co_logo.png"
          );

          slide.layout = slide.layout.replaceAll(
            "/resource/1717616240000/SunSolarLogo",
            "/assets/sun_co_logo.png"
          );

          slide.layout = slide.layout.replaceAll(
            "/resource/1717381453000/SolarLogo",
            "/assets/sun_co_logo.png"
          );

          slide.layout = slide.layout.replaceAll(
            "/resource/1723239105000/cover_4",
            "/assets/cover_4.png"
          );

          // /resource/1723125593000/Sample_Bill
          slide.layout = slide.layout.replaceAll(
            "/resource/1723125593000/Sample_Bill",
            "/assets/Sample_Bill.png"
          );

          //1723128542000/cust_confirm_demo
          slide.layout = slide.layout.replaceAll(
            "/resource/1723128542000/cust_confirm_demo",
            "/assets/cust_confirm_demo.png"
          );

          // 1723130595000/stats_demo
          slide.layout = slide.layout.replaceAll(
            "/resource/1723130595000/stats_demo",
            "/assets/stats_demo.png"
          );

          //1723126321000/tadao_demo
          slide.layout = slide.layout.replaceAll(
            "/resource/1723126321000/tadao_demo",
            "/assets/tadao_demo.png"
          );

          //1723127445000/warranties_demo
          slide.layout = slide.layout.replaceAll(
            "/resource/1723127445000/warranties_demo",
            "/assets/warranties_demo.png"
          );

          //1723124982000/solutions_demo
          slide.layout = slide.layout.replaceAll(
            "/resource/1723124982000/solutions_demo",
            "/assets/solutions_demo.png"
          );

          //1723126842000/enery_efficiency_demo
          slide.layout = slide.layout.replaceAll(
            "/resource/1723126842000/enery_efficiency_demo",
            "/assets/enery_efficiency_demo.png"
          );

          //1723130034000/pane_happy_kids
          slide.layout = slide.layout.replaceAll(
            "/resource/1723130034000/pane_happy_kids",
            "/assets/pane_happy_kids.png"
          );

          //1723131223000/referral_info_demo
          slide.layout = slide.layout.replaceAll(
            "/resource/1723131223000/referral_info_demo",
            "/assets/referral_info_demo.png"
          );

          //1723129719000/Install_demo
          slide.layout = slide.layout.replaceAll(
            "/resource/1723129719000/Install_demo",
            "/assets/Install_demo.png"
          );
          //1723130233000/panel_happy
          slide.layout = slide.layout.replaceAll(
            "/resource/1723130233000/panel_happy",
            "/assets/panel_happy.png"
          );

          // slide.layout = slide.layout.replaceAll( '/resource/','https://patterai--uat.sandbox.my.site.com/resource/')

          //  1723241447000/sun_co_logo

          const parsedLayout = JSON.parse(slide.layout);

          return {
            ...slide,
            layout: parsedLayout,
            steps: parsedLayout.steps,
          };
        });

        // // // insert a new slide after the first one for energy efficiency overview
        // parsedData.slides.splice(1, 0, {
        //   tags: 'Solar',
        //   template: 'Default Presentation',
        //   layout: {
        //     hasGutters: true,
        //     styleOverride: 'background-color:#F4F6F9;',
        //     type: 'grid',
        //     content: [
        //       {
        //         title: 'Full width',
        //         content: 'This is the full width content',
        //         type: 'lwccomponent',
        //         componentName: 'c/presentation_energyEfficiencyOverview',
        //         styleOverride: 'width: 100%; height: 100%;',
        //         childProps: {
        //           solarGrafDesignId: '{{salesOpportunity.solarGrafDesignId}}',
        //           recordId: '{{salesOpportunity.Id}}',
        //         },
        //         size: 2,
        //       },
        //     ],
        //   },
        //   order: '1.5',
        //   name: 'Energy Efficiency Overview',
        // });

        // // lets add a product detail slide after the energy efficiency overview slide
        // parsedData.slides.splice(2, 0, {
        //   tags: 'Solar',
        //   template: 'Default Presentation',
        //   layout: {
        //     hasGutters: true,
        //     styleOverride: 'background-color:#F4F6F9;',
        //     type: 'grid',
        //     content: [
        //       {
        //         title: 'Full width',
        //         content: 'This is the full width content',
        //         type: 'lwccomponent',
        //         componentName: 'c/presentation_energyEfficiencyProductDetail',
        //         styleOverride: 'width: 100%; height: 100%;',
        //         childProps: {
        //           solarGrafDesignId: '{{salesOpportunity.solarGrafDesignId}}',
        //           recordId: '{{salesOpportunity.Id}}',
        //           product: {name: 'Nest Thermostat', Id: '12345'},
        //         },
        //         size: 2,
        //       },
        //     ],
        //   },
        //   order: '1.8',
        //   name: 'Energy Efficiency Product Detail',
        // });

        // // lets add a product detail slide after the energy efficiency overview slide
        // parsedData.slides.splice(3, 0, {
        //   tags: 'Solar',
        //   template: 'Default Presentation',
        //   layout: {
        //     hasGutters: true,
        //     styleOverride: 'background-color:#F4F6F9;',
        //     type: 'grid',
        //     content: [
        //       {
        //         title: 'Full width',
        //         content: 'This is the full width content',
        //         type: 'lwccomponent',
        //         componentName: 'c/presentation_energyEfficiencyProductDetail',
        //         styleOverride: 'width: 100%; height: 100%;',
        //         childProps: {
        //           solarGrafDesignId: '{{salesOpportunity.solarGrafDesignId}}',
        //           recordId: '{{salesOpportunity.Id}}',
        //           product: {name: 'Air Seal House', Id: '12345'},
        //         },
        //         size: 2,
        //       },
        //     ],
        //   },
        //   order: '1.9',
        //   name: 'Energy Efficiency Product Detail 2',
        // });

        // // lets add a product detail slide after the energy efficiency overview slide
        // parsedData.slides.splice(0, 0, {
        //   tags: 'Solar',
        //   template: 'Default Presentation',
        //   layout: {
        //     hasGutters: true,
        //     styleOverride: 'background-color:#F4F6F9;',
        //     type: 'grid',
        //     content: [

        //       {
        //         title: 'Full width',
        //         content: 'This is the full width content',
        //         type: 'lwccomponent',
        //         componentName: 'c/presentation_manualApproval',
        //         styleOverride: 'width: 100%; height: 100%;',
        //         childProps: {
        //           solarGrafDesignId: '{{salesOpportunity.solarGrafDesignId}}',
        //           recordId: '{{salesOpportunity.Id}}',
        //           product: {name: 'Air Seal House', Id: '12345'},
        //         },
        //         size: 2,
        //       },
        //     ],
        //   },
        //   order: '1.9',
        //   name: 'Loan Approval',
        // });

        //   parsedData.slides.splice(0, 0, {
        //     tags: 'Solar',
        //     template: 'Default Presentation',
        //     layout: {
        //       hasGutters: true,
        //       styleOverride: 'background-color:#F4F6F9;',
        //       type: 'grid',
        //       content: [
        //         {
        //           "title": "Left Side",
        //           "type": "image",
        //           "imageUrl": "/assets/sun_co_logo.png",
        //           "styleOverride": "width:100%;height:100%;background:url(/resource/1723128542000/cust_confirm_demo); background-position: center; background-repeat:no-repeat;background-size: cover;",
        // "imageStyle": "object-fit: contain;height:0px; position:absolute; left:55px; top:10%;border-radius:0px;border-color:#F4F6F9;",
        //           // "styleOverride": "width:100%;height:100%;background:url(/resource/1716496456000/Solar_customers); background-position: center; background-repeat:no-repeat;background-size: cover;",
        //           // "imageStyle": "object-fit: contain;height:0px; position:absolute; left:55px; top:10%;background-color:white;border-radius:5px;",
        //           "size": 2
        //       },
        //         {
        //           title: 'Full width',
        //           content: 'This is the full width content',
        //           type: 'lwccomponent',
        //           componentName: 'c/presentation_loanSelection',
        //           styleOverride: 'width: 100%; height: 100%;display:flex;flex-direction:column;justify-content:center;',
        //           childProps: {
        //             solarGrafDesignId: '{{salesOpportunity.solarGrafDesignId}}',
        //             recordId: '{{salesOpportunity.Id}}',
        //           },
        //           size: 2,
        //         },
        //       ],
        //     },
        //     order: '1.9',
        //     name: 'Loan Options',
        //   });

        // // add slide with energy efficiency calculator presentation_energyEfficiencyCalculator
        // parsedData.slides.splice(4, 0, {
        //   tags: 'Solar',
        //   template: 'Default Presentation',
        //   layout: {
        //     hasGutters: true,
        //     styleOverride: 'background-color:#F4F6F9;',
        //     type: 'grid',
        //     content: [
        //       {
        //         title: 'Full width',
        //         content: 'This is the full width content',
        //         type: 'lwccomponent',
        //         componentName: 'c/presentation_energyEfficiencyCalculator',
        //         styleOverride: 'width: 100%; height: 100%;',
        //         childProps: {
        //           solarGrafDesignId: '{{salesOpportunity.solarGrafDesignId}}',
        //           recordId: '{{salesOpportunity.Id}}',
        //           product: {name: 'Air Seal House', Id: '12345'},
        //         },
        //         size: 2,
        //       },
        //     ],
        //   },
        //   order: '1.91',
        //   name: 'Energy Efficiency Calculator',
        // });

        // replace insert new slide after with title: "Energypro Builder" with a new slide
        // const systemDesignSlideIndex = parsedData.slides.findIndex(
        //   (slide: any) => slide.name === 'Energypro Builder'
        // );

        // parsedData.slides.splice(systemDesignSlideIndex + 1, 0, {
        //   tags: 'Solar',
        //   template: 'Default Presentation',
        //   layout: {
        //     hasGutters: true,
        //     type: 'grid',
        //     content: [
        //       {
        //         title: 'Full width',
        //         content: 'This is the full width content',
        //         type: 'lwccomponent',
        //         componentName: 'c/solargraf3DModel',
        //         childProps: {
        //           solarGrafDesignId: '{{salesOpportunity.solargrafDesignId}}',
        //           solarGrafProjectId: '{{salesOpportunity.solarGrafProjectId}}',
        //           recordId: '{{salesOpportunity.Id}}',
        //           style:
        //             'width: 100vw; height: 100vh; overflow-y: hidden;position:absolute;top: 0;left: 0;background-color:#F4F6F9; margin-bottom: 32px; bottom: 0px;',
        //         },
        //         size: 3,
        //       },
        //       {
        //         title: 'Right side',
        //         content: '',
        //         childProps: {
        //           recordId: '{{salesOpportunity.Id}}',
        //         },
        //         size: 1,
        //         styleOverride:
        //           'width: 30vw; height: 100vh;overflow:hidden;padding: 20px;margin-bottom: 20px; overflow-y: auto;top: 0;right: 0px;position:absolute;min-width: 360px;',
        //         childLayout: {
        //           content: [
        //             // {
        //             //   type: 'lwccomponent',
        //             //   componentName: 'c/lwcPresentationDesignChanger',
        //             //   childProps: {
        //             //     recordId: '{{salesOpportunity.Id}}',
        //             //   },
        //             // },
        //             // {
        //             //   type: 'lwccomponent',
        //             //   componentName: 'c/solargrafCharts',
        //             //   childProps: {
        //             //     recordId: '{{salesOpportunity.Id}}',
        //             //   },
        //             // },
        //             {
        //               type: 'lwccomponent',
        //               componentName: 'c/solargrafDetails',
        //               childProps: {
        //                 recordId: '{{salesOpportunity.Id}}',
        //               },
        //               styleOverride: 'margin-bottom: 20px;',
        //             },
        //           ],
        //         },
        //       },
        //       {
        //         title: 'Pricing Sidebar',
        //         content: '',
        //         type: 'lwccomponent',
        //         componentName: 'c/lwcPresentationPricingSidebar',
        //         childProps: {
        //           recordId: '{{salesOpportunity.Id}}',
        //         },
        //         size: 0,
        //       },
        //     ],
        //   },
        //   order: '7',
        //   name: 'System Design 2',
        // });
        console.log("Processed presentation data:", parsedData);
        setAllSlides({ slides: parsedData.slides });
        appState.setSlides(parsedData.slides as any);
      } catch (error) {
        console.error("Error fetching presentation:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
      } finally {
        appState.setIsLoading(false);
      }
    };

    fetchPresentation();
  }, [appState.presentationId, appState.currentSlideIndex]);

  const handleComponentLoadingChange = useCallback((isLoading: boolean) => {
    setIsComponentLoading(isLoading);
    appState.setIsLoading(isLoading || appState.isLoading.get());
  }, []);

  const handleSlideChange = useCallback(
    (index: number) => {
      appState.setIsLoading(true);
      appState.setCurrentSlideIndex(index);
      updateCurrentSlideUrl(router, index);
      setTimeout(() => appState.setIsLoading(false), 100);
    },
    [router]
  );

  const handleNext = useCallback(() => {
    // test new logic
    // slide definition can have steps. Not at component level. Components can decide if to or not subscribe to steps
    // when a slide has "steps", instead of navigating the whole UI, we navigate through its steps, when on the last step, we can navigate the entire ui
    // simulate for site confirmation
    // console.log("Current slide ", appState.currentSlide())

    if (appState.currentSlide().steps?.length > 0) {
      console.log(
        "We are on site confirmation, not navigating",
        appState.currentSlide()
      );
      // assume we have three steps defined for this slide i.e. address, pin and details
      // we can navigate through the steps while storing the data in the appState\
      // once we are done, we can navigate to the next slide ["ADDRESS", "PIN", "DETAILS"]
      const steps = appState.currentSlide().steps;
      console.log("Steps ", steps)
      const currentStep = appState.currentStepIndex.get();
      console.log("Current Step ", currentStep);
      if (currentStep < steps.length - 1) {
        appState.currentStepIndex.set(currentStep + 1);
        return;
      }
    }

    const nextIndex = Math.min(
      appState.currentSlideIndex.get() + 1,
      allSlides.slides.length - 1
    );

    // clear the current step
    appState.currentStepIndex.set(0);

    handleSlideChange(nextIndex);
  }, [allSlides.slides.length, handleSlideChange]);

  const handlePrevious = useCallback(() => {
    const prevIndex = Math.max(appState.currentSlideIndex.get() - 1, 0);
    handleSlideChange(prevIndex);
  }, [handleSlideChange]);

  const togglePhotoUploader = () => {
    appState.showPhotoUploader.set(!appState.showPhotoUploader.get());
  };

  return (
    <SalesforceProvider>
      <div className="dashboard">
        <MenuContainer
          allSlides={allSlides}
          handlePrevious={handlePrevious}
          handleNext={handleNext}
          togglePhotoUploader={togglePhotoUploader}
        />
        <SlideMenu />
        <div className="content">
          <Loader contextVariables={contextVariables} />
          {allSlides.slides.length > 0 ? (
            <Suspense fallback={<Loader contextVariables={contextVariables} />}>
              <PresentationRenderer
                data={allSlides}
                context={contextVariables}
                components={components}
                dataHooks={dataHooks}
                currentSlideIndex={appState.currentSlideIndex.get()}
                onLoadingChange={handleComponentLoadingChange}
              />
            </Suspense>
          ) : (
            <>
              {/* <iframe style={{
              border: 'none',
              width: '100%',
              height: '100%',
              position: 'absolute',
              backgroundColor: 'white',
              top: 0,
              left: 0,
              zIndex: 1000,
            }}  src="https://embed.figma.com/proto/4yLc2iylnZNNf7U1e7e4IZ/Patter-AI-Platform?page-id=2165%3A17447&node-id=5479-6827&node-type=frame&viewport=-4422%2C3865%2C0.29&scaling=fit-width&content-scaling=fixed&starting-point-node-id=5479%3A6827&show-proto-sidebar=1&embed-host=share&hide-ui=1&theme=light" allowFullScreen></iframe> */}
              <div
                className={classNames(
                  styles["no-data-message"],
                  "no-data-message"
                )}
              >
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 13H11V7H13M13 17H11V15H13M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
                    fill="#023B95"
                  />
                </svg>
                <h2>No Presentation Data Available</h2>
                <p>
                  We couldn't load the presentation data at this time. Please
                  try again later or contact support if the issue persists.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </SalesforceProvider>
  );
});
