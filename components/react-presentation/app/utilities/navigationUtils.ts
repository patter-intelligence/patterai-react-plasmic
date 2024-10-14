import { NextRouter } from 'next/router';

export const updateCurrentSlideUrl = (router: NextRouter, index: number) => {
  // also update the window.parent
  if(window.__salesforce__){
    console.log("updating slide in SF")
    window.__salesforce__.updateCurrentSlide({ currentSlide: index });
  }
  router.push(
    {
      pathname: router.pathname,
      query: { ...router.query, currentSlide: index.toString() },
    },
    undefined,
    { shallow: true }
  );
};
