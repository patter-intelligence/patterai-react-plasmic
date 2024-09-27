import { NavigateFunction } from 'react-router-dom';

export const updateCurrentSlideUrl = (navigate: NavigateFunction, index: number) => {
  const params = new URLSearchParams(window.location.search);
  params.set('currentSlide', index.toString());
  navigate(`?${params.toString()}`, { replace: true });
};
