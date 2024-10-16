import React from 'react';
import { observer } from '@legendapp/state/react';
import { appState } from '../state/appState';
import './Loader.module.css';
interface LoaderProps {
  contextVariables: {
    LOADER_LOGO: string;
    COMPANY_NAME: string;
  };
}

export const Loader: React.FC<LoaderProps> = observer(
  (
    { contextVariables } = {
      contextVariables: {
        LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
        COMPANY_NAME: 'Patter AI',
      },
    }
  ) => {
    return (
      <div
        className={`ll-loader-wrapper ${appState.isLoading.get() ? 'visible' : 'hidden'
          }`}
      >
        <div className="ll-loader-container">
          {/* <div
          className="logo-loader"
          style={{
            backgroundImage: `url(${contextVariables.LOADER_LOGO})`,
          }}
        ></div> */}
          <img src={contextVariables.LOADER_LOGO} alt="Patter Logo"  className="up-logo"/>
          <div className="company-name">{contextVariables.COMPANY_NAME}</div>
          <div className="ll-loading-bar">
            <div className="ll-loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }
);

export const LoadingSpinner: React.FC<{
  isLoading: boolean;
  message: string;
}> = ({ isLoading, message }) => (
  <div className={`ll-loader-wrapper ${isLoading ? 'visible' : 'hidden'}`}>
    <div className="ll-loader-container">
      <img
        src={'https://patter-demos-mu.vercel.app/Patter_Logo.png'}
        alt="Patter Logo"
        className="up-logo"
      />
      <div className="company-name">{message}</div>
      <div className="ll-loading-bar">
        <div className="ll-loading-progress"></div>
      </div>
    </div>
  </div>
);

export default Loader;
