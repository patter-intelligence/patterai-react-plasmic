import { NextRouter } from 'next/router';

export const updateCurrentSlideUrl = (router: NextRouter, index: number) => {
  router.push(
    {
      pathname: router.pathname,
      query: { ...router.query, currentSlide: index.toString() },
    },
    undefined,
    { shallow: true }
  );
};
