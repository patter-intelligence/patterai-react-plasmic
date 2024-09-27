/* eslint-disable no-restricted-globals */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Route, Router, RouterProvider, Routes } from 'react-router-dom';
// import { router } from './router';
import { SalesforceProvider } from './providers/SalesforceProvider';
import { appState } from './state/appState';
import { enableReactComponents } from '@legendapp/state/config/enableReactComponents';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { configureObservableSync } from '@legendapp/state/sync';
import { useState, useEffect } from 'react';
import { Home } from './components/Home';

// Webpack configuration
const webpackConfig = {
  resolve: {
    fallback: {
      stream: require.resolve('stream-browserify'),
    },
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

// Add type declaration for module.hot
declare const module: {
  hot?: {
    accept: () => void;
  };
};

// Enable HMR
if (module.hot) {
  module.hot.accept();
}

// @ts-ignore
globalThis.REACT_QUERY_CLIENT = queryClient;

export function App() {
  // initialize app state
  // @ts-ignore
  appState.recordId.set(new URLSearchParams(location.search).get('recordId'));

  return (
    <QueryClientProvider client={queryClient}>
      <SalesforceProvider>
       <Home />
      </SalesforceProvider>
      {/* <ReactQueryDevtools initialIsOpen={true} /> */}
    </QueryClientProvider>
  );
}


export default App;
