import React, { useState, useEffect } from 'react';
import './SlideMenu.module.css';
import { observer } from '@legendapp/state/react';
import { appState } from '../state/appState';
import { useRouter } from 'next/router';
import { updateCurrentSlideUrl } from '../utilities/navigationUtils';
import SlideIcon from './SlideIcon';

const SlideMenu: React.FC = observer(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSlides, setFilteredSlides] = useState(appState.slides.get());
  const router = useRouter();

  useEffect(() => {
    const filtered = appState.slides
      .get()
      .filter((slide: { name: string; }) =>
        slide.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    setFilteredSlides(filtered);
  }, [searchQuery, appState.slides.get()]);

  return (
    <div className={`slide-in-menu ${appState.isMenuOpen.get() ? 'open' : ''}`}>
      <div className="menu-content">
        <div className="menu-search">
          <input
            type="text"
            placeholder="Search slides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="current-slide-info">
          <h2>
            <b>Current Slide </b>
          </h2>
          <p>
            {appState.slides.get()[appState.currentSlideIndex.get()]?.name ||
              'N/A'}
          </p>
        </div>
        <ul className="menu-items">
          {filteredSlides.map((slide: { name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }, index: React.Key | null | undefined) => (
            <li
              key={index}
              className={`${
                index === appState.currentSlideIndex.get() ? 'active' : ''
              } ${
                Number(index) !== null && Number(index) !== undefined && Number(index) <= appState.highestVisitedSlideIndex.get()
                  ? 'accessible'
                  : 'inaccessible'
              }`}
              onClick={() => {
                console.log('Clicked slide index:', index);
                console.log('Highest visited slide index:', appState.highestVisitedSlideIndex.get());
                if (index !== null && index !== undefined && Number(index) <= appState.highestVisitedSlideIndex.get()) {
                  console.log('Setting current slide index to:', index);
                  appState.setCurrentSlideIndex(Number(index));
                  updateCurrentSlideUrl(router, Number(index));
          
                  appState.toggleMenu();
                } else {
                  console.log('Cannot navigate to this slide yet');
                }
              }}
              style={{ cursor: index !== null && index !== undefined && Number(index) <= appState.highestVisitedSlideIndex.get() ? 'pointer' : 'not-allowed' }}
            >
              {slide.name}
              <SlideIcon index={index} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

export default SlideMenu;

