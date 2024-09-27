/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState, Suspense } from 'react';
import {
  PresentationRenderer,
  IPresentationSlides,
  ContextVariables,
} from './PresentationRenderer';
import PresentationUtilityProfile from '../slides/utility-confirmation/PresentationUtilityProfile';
import PhotoUploader from '../slides/PhotoUploader';
import styles from './Home.module.css';
import classNames from 'classnames';
import './PresentationStyles.module.css';
import { components } from './ComponentsRegistry';
import Loader from './Loader';
import SlideMenu from './SlideMenu';
import { appState } from '../state/appState';
import { observer } from '@legendapp/state/react';
import { useRouter } from 'next/router';
import {
  SalesforceProvider,
  useSalesforce,
} from '../providers/SalesforceProvider';
// import { ENERGY_EFFICIENCY_PRODUCTS } from '../slides/EnergyEfficiency';
import { updateCurrentSlideUrl } from '../utilities/navigationUtils';
import { parse } from 'path';

const dataHooks = {
  additionalData: async (context: ContextVariables) => {
    // Simulating an API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { someExtraInfo: 'This is additional data loaded asynchronously' };
  },
};

const contextVariables = {
  PATTER_SLIDE_STATIC_IMAGE: '/assets/PatterSlideStaticImage.png',
  COMPANY_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
  EXAMPLE_IFRAME_URL: 'https://example.com',
  salesOpportunity: {
    Id: '12345',
  },
  LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
  COMPANY_NAME: 'Patter AI',
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
    const currentSlide = Number(router.query.currentSlide || 0);
    if(!currentSlide) {
      appState.setCurrentSlideIndex(0);
    }
    appState.setCurrentSlideIndex(currentSlide);

    // check if there is presentationId in the query params
    const presentationId = router.query.presentationId as string;
    if (presentationId) {
      appState.presentationId.set(presentationId);
    }

    // Fetch presentation data
    const fetchPresentation = async () => {
      console.log('Fetching presentation data...');
      try {
        console.log('Current recordId:', appState.recordId.get());
        let presentationData;

        if(presentationId) {
         presentationData =
          await salesforce.getPresentationById(
            presentationId, appState.recordId.get()
          );
        }
        else {
          presentationData =  await salesforce.getPresentationForSalesOpportunity(
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
            '/resource/1715119601000/SunSolarReferralSlide',
            '/assets/SunSolarReferralSlide.png'
          );
          slide.layout = slide.layout.replaceAll(
            '/resource/1715123181000/SunSolarCostToDoNothing',
            '/assets/SunSolarCostToDoNothing.png'
          );
          // /resource/1717526838000/SunSolarLogo
          slide.layout = slide.layout.replaceAll(
            '/resource/1717526838000/SunSolarLogo',
            'https://patter-demos-mu.vercel.app/Patter_Logo.png'
          );

          slide.layout = slide.layout.replaceAll(
            '/resource/1717526927000/SunSolarLogo',
            'https://patter-demos-mu.vercel.app/Patter_Logo.png'
          );

          slide.layout = slide.layout.replaceAll(
            '/resource/1715122593000/SunSolarLogo',
            'https://patter-demos-mu.vercel.app/Patter_Logo.png'
          );

          slide.layout = slide.layout.replaceAll(
            '/resource/1716496456000/Solar_customers',
            'https://patter-demos-mu.vercel.app/Patter_Logo.png'
          );

          slide.layout = slide.layout.replaceAll(
            '/resource/1723241447000/sun_co_logo',
            '/assets/sun_co_logo.png'
          );

          slide.layout = slide.layout.replaceAll(
            '/resource/1717616240000/SunSolarLogo',
            '/assets/sun_co_logo.png'
          );

          
          slide.layout = slide.layout.replaceAll(
            '/resource/1717381453000/SolarLogo',
            '/assets/sun_co_logo.png'
          );
          
          
          slide.layout = slide.layout.replaceAll(
            '/resource/1723239105000/cover_4',
            '/assets/cover_4.png'
          );

          // /resource/1723125593000/Sample_Bill
          slide.layout = slide.layout.replaceAll(
            '/resource/1723125593000/Sample_Bill',
            '/assets/Sample_Bill.png'
          );

          //1723128542000/cust_confirm_demo
          slide.layout = slide.layout.replaceAll(
            '/resource/1723128542000/cust_confirm_demo',
            '/assets/cust_confirm_demo.png'
          );

          // 1723130595000/stats_demo
          slide.layout = slide.layout.replaceAll(
            '/resource/1723130595000/stats_demo',
            '/assets/stats_demo.png'
          );

          //1723126321000/tadao_demo
          slide.layout = slide.layout.replaceAll(
            '/resource/1723126321000/tadao_demo',
            '/assets/tadao_demo.png'
          );

          //1723127445000/warranties_demo
          slide.layout = slide.layout.replaceAll(
            '/resource/1723127445000/warranties_demo',
            '/assets/warranties_demo.png'
          );

          //1723124982000/solutions_demo
          slide.layout = slide.layout.replaceAll(
            '/resource/1723124982000/solutions_demo',
            '/assets/solutions_demo.png'
          );

          //1723126842000/enery_efficiency_demo
          slide.layout = slide.layout.replaceAll(
            '/resource/1723126842000/enery_efficiency_demo',
            '/assets/enery_efficiency_demo.png'
          );

          //1723130034000/pane_happy_kids
          slide.layout = slide.layout.replaceAll(
            '/resource/1723130034000/pane_happy_kids',
            '/assets/pane_happy_kids.png'
          );

          

          //1723131223000/referral_info_demo
          slide.layout = slide.layout.replaceAll(
            '/resource/1723131223000/referral_info_demo',
            '/assets/referral_info_demo.png'
          );

          //1723129719000/Install_demo
          slide.layout = slide.layout.replaceAll(
            '/resource/1723129719000/Install_demo',
            '/assets/Install_demo.png'
          );
          //1723130233000/panel_happy
          slide.layout = slide.layout.replaceAll(
            '/resource/1723130233000/panel_happy',
            '/assets/panel_happy.png'
          );




          // slide.layout = slide.layout.replaceAll( '/resource/','https://patterai--uat.sandbox.my.site.com/resource/')


        //  1723241447000/sun_co_logo

          return {
            ...slide,
            layout: JSON.parse(slide.layout),
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
        console.log('Processed presentation data:', parsedData);
        setAllSlides({ slides: parsedData.slides });
        appState.setSlides(parsedData.slides as any);
      } catch (error) {
        console.error('Error fetching presentation:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
      } finally {
        appState.setIsLoading(false);
      }
    };

    fetchPresentation();
  }, [location]);

  const handleComponentLoadingChange = useCallback((isLoading: boolean) => {
    setIsComponentLoading(isLoading);
    appState.setIsLoading(isLoading || appState.isLoading.get());
  }, []);

  const handleSlideChange = useCallback(
    (index: number) => {
      appState.setIsLoading(true);
      appState.setCurrentSlideIndex(index);
      router.push({
        pathname: router.pathname,
        query: { ...router.query, currentSlide: index },
      }, undefined, { shallow: true });
      setTimeout(() => appState.setIsLoading(false), 100);
    },
    [router]
  );

  const handleNext = useCallback(() => {
    const nextIndex = Math.min(
      appState.currentSlideIndex.get() + 1,
      allSlides.slides.length - 1
    );
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
        <div className="menu-container">
          <div className="menu-icon">
            <svg
              width="31"
              height="35"
              viewBox="0 0 31 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.15732 32.0406H10.1216V19.2944H20.0809V32.0406H28.0452V12.5426L15.1013 2.71213L2.15732 12.5426V32.0406ZM0 34.207V11.4594L15.1013 0L30.2025 11.4594V34.207H17.9236V21.4608H12.2789V34.207H0Z"
                fill="#023B95"
              />
            </svg>
          </div>
          <div
            className={`menu-icon ${
              appState.isLoading.get() ? 'disabled' : ''
            }`}
            onClick={() => !appState.isLoading.get() && appState.toggleMenu()}
          >
            <svg
              width="35"
              height="23"
              viewBox="0 0 35 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 22.8373V20.6708H34.5253V22.8373H0ZM0 12.5019V10.3354H34.5253V12.5019H0ZM0 2.16645V0H34.5253V2.16645H0Z"
                fill="#023B95"
              />
            </svg>
          </div>
          <div className="menu-icon" onClick={togglePhotoUploader}>
            <svg
              width="39"
              height="36"
              viewBox="0 0 39 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_231_334)">
                <path
                  d="M39 11.6196L31.528 8.61095L27.8427 16.0599L29.8271 17.0974L31.9938 12.6986C32.581 14.4 32.905 16.1637 32.905 17.9896C32.905 26.6628 26.0202 33.6968 17.5561 33.6968C9.0919 33.6968 2.22741 26.6628 2.22741 17.9896C2.22741 9.31643 9.11215 2.28242 17.5561 2.28242V0C7.87695 0 0 8.07147 0 17.9896C0 27.9078 7.87695 35.9793 17.5561 35.9793C27.2352 35.9793 35.1122 27.9078 35.1122 17.9896C35.1122 15.9769 34.7882 14.0058 34.1604 12.1383L38.1698 13.7568L38.9798 11.6403L39 11.6196Z"
                  fill="#023B95"
                />
                <path
                  d="M10.9548 20.355L10.8333 26.1441C10.8333 26.6421 11.0763 27.0986 11.461 27.3475C11.6635 27.472 11.9065 27.5343 12.1495 27.5343C12.3723 27.5343 12.595 27.472 12.8177 27.3683L17.5966 24.6086V24.5671L30.1916 4.2951L23.6308 0L11.0156 20.3758H10.9751L10.9548 20.355ZM13.162 21.766L15.4299 23.2392L13.1012 24.5879L13.162 21.766ZM24.3193 3.15389L27.1137 4.97983L16.8676 21.4963L14.0732 19.6703L24.3193 3.15389Z"
                  fill="#023B95"
                />
              </g>
              <defs>
                <clipPath id="clip0_231_334">
                  <rect width="39" height="36" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <div className="menu-icon" onClick={appState.toggleMenu}></div>
          <ul>{/* Add menu items here */}</ul>
          <div className="menu-navigation"> <button
              className="lightning-button-icon previous"
              onClick={handlePrevious}
              disabled={appState.currentSlideIndex.get() === 0}
            >
              <svg
                width="38"
                height="38"
                viewBox="0 0 38 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.5739 19.2079L23.0815 27.7515L21.7758 29.0628L11.9624 19.2079L21.7758 9.35303L23.0815 10.6643L14.5739 19.2079Z"
                  fill="#9B9B9B"
                />
              </svg>
            </button>
            <button
              className="lightning-button-icon next"
              onClick={handleNext}
              disabled={
                appState.currentSlideIndex.get() === allSlides.slides.length - 1
              }
            >
              <svg
                width="38"
                height="38"
                viewBox="0 0 38 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.5887 37.3345C28.8549 37.3345 37.1773 28.9769 37.1773 18.6673C37.1773 8.35762 28.8549 0 18.5887 0C8.32243 0 0 8.35762 0 18.6673C0 28.9769 8.32243 37.3345 18.5887 37.3345Z"
                  fill="#023B95"
                />
                <path
                  d="M23.0493 18.5614L14.5416 10.0178L15.8474 8.70651L25.6608 18.5614L15.8474 28.4163L14.5416 27.105L23.0493 18.5614Z"
                  fill="white"
                />
              </svg>
            </button>
           
          </div>
        </div>
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
                styles['no-data-message'],
                'no-data-message'
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
                We couldn't load the presentation data at this time. Please try
                again later or contact support if the issue persists.
              </p>
            </div>
            </>
          )}
        </div>
      </div>
    </SalesforceProvider>
  );
});
