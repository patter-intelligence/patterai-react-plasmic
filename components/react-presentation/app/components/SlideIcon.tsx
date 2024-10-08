import React from 'react';
import { observer } from '@legendapp/state/react';
import { appState } from '../state/appState';

import { Settings as SettingsIcon } from '@material-ui/icons';
import { Done as CheckIcon } from '@material-ui/icons';
import { VisibilityOff as LockIcon } from '@material-ui/icons';
import {Visibility as VisibleIcon}from '@material-ui/icons';


interface SlideIconProps {
  index: React.Key | null | undefined;
}

const SlideIcon: React.FC<SlideIconProps> = observer(({ index }) => {
  const isCurrent = index === appState.currentSlideIndex.get();
  // console.log({isCurrent,index, appIndex: appState.currentSlideIndex.get()})
  const isAccessible = index !== null && index !== undefined && Number(index) <= appState.highestVisitedSlideIndex.get();

  if (isCurrent) {
    return (
      // <svg className="slide-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      //   <path d="M16.7 5.3c.4.4.4 1 0 1.4l-8 8c-.4.4-1 .4-1.4 0l-4-4c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0L8 12.6l7.3-7.3c.4-.4 1-.4 1.4 0z" fill="#696969"/>
      // </svg>
      <CheckIcon style={{
        color: "rgba(0, 0, 0, 0.56)"}}/>
    );
  } else if (isAccessible) {
    return (
      // <svg className="slide-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      //   <path d="M10 4.5c-2.9 0-5.5 1.7-7.5 3.7-.3.3-.5.7-.5 1.1 0 .4.2.8.5 1.1 2 2 4.6 3.7 7.5 3.7s5.5-1.7 7.5-3.7c.3-.3.5-.7.5-1.1 0-.4-.2-.8-.5-1.1-2-2-4.6-3.7-7.5-3.7zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" fill="#696969"/>
      //   <path d="M10 7.5c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z" fill="#696969"/>
      // </svg>
      <VisibleIcon style={{
        color: "rgba(0, 0, 0, 0.56)"}}/>
    );
  } else {
    return (
      // <svg className="slide-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      //   <path d="M15 9h-1V6c0-2.2-1.8-4-4-4S6 3.8 6 6v3H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h10c.6 0 1-.4 1-1v-7c0-.6-.4-1-1-1zm-6-3c0-1.1.9-2 2-2s2 .9 2 2v3H9V6z" fill="#696969"/>
      // </svg>
      <LockIcon style={{
        color: "rgba(0, 0, 0, 0.56)"}}/>
    );
  }
});

export default SlideIcon;
