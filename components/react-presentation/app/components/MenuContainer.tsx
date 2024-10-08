import React from 'react';
import { appState } from '../state/appState';
import { observer } from '@legendapp/state/react';
import { useRouter } from 'next/router';
import {Menu as MenuIcon}from '@material-ui/icons';
import {ArrowForward}from '@material-ui/icons';


interface MenuContainerProps {
  allSlides: { slides: any[] };
  handlePrevious: () => void;
  handleNext: () => void;
  togglePhotoUploader: () => void;
}

export const MenuContainer: React.FC<MenuContainerProps> = observer(({
  allSlides,
  handlePrevious,
  handleNext,
  togglePhotoUploader
}) => {
  const router = useRouter();

  return (
    <div className="menu-container">
      {/* <div className="menu-icon">
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
      </div> */}
      <div
        className={`menu-icon ${
          appState.isLoading.get() ? 'disabled' : ''
        }`}
        onClick={() => !appState.isLoading.get() && appState.toggleMenu()}
      >
        {/* <svg
          width="35"
          height="23"
          viewBox="0 0 35 23"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 22.8373V20.6708H34.5253V22.8373H0ZM0 12.5019V10.3354H34.5253V12.5019H0ZM0 2.16645V0H34.5253V2.16645H0Z"
            fill="white"
          />
        </svg> */}
        <div style={{  backgroundColor: "rgba(255,255,255,1)", position: "fixed", top:0, left:0,
          borderBottomRightRadius: 8,
          display: "flex",
          padding: 10
         }}>
        <MenuIcon  style={{
           color: "rgba(0, 0, 0, 0.56)",
           fontSize: 26
           
          //  borderRadius: 30
        }} />
        </div>
      </div>
      {/* <div className="menu-icon" onClick={togglePhotoUploader}>
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
      </div> */}
      <div className="menu-icon" onClick={appState.toggleMenu}></div>
      <ul>{/* Add menu items here */}</ul>
      <div className="menu-navigation"> 
        {/* <button
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
        </button> */}
        <button
          className="lightning-button-icon next"
          onClick={handleNext}
          disabled={
            appState.currentSlideIndex.get() === allSlides.slides.length - 1
          }
        >
          {/* <svg
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
          </svg> */}
          <div style={{border: "2px solid #01348A", borderRadius: 30, padding: 4, display: "flex",backgroundColor: "rgba(255,255,255,1)", }}>
          <ArrowForward style={{
            color: "#01348A",
            fontSize: 35
          }} />
          </div>
        </button>
      </div>
    </div>
  );
});
