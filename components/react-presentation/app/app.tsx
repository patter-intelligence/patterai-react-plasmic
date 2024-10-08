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
import { useTheme, createTheme, ThemeProvider } from '@mui/material/styles';

import { ToastContainer } from 'react-toastify';                                                              
import 'react-toastify/dist/ReactToastify.css'; 

const theme = createTheme({
  components: {
    // Name of the component
    MuiButton: {
      styleOverrides: {
        // Name of the slot
        root: {
          // Some CSS
          fontSize: '1rem',
        },
      },
    },
  },
});

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





 

export function App() {
  // initialize app state

  const [loaded,setLoaded] = useState(false);

  useEffect(()=>{ // @ts-ignore
    globalThis.REACT_QUERY_CLIENT = queryClient;
    // @ts-ignore
    appState.recordId.set(new URLSearchParams(globalThis.location.search).get('recordId'));
    // @ts-ignore
    appState.presentationId.set(new URLSearchParams(globalThis.location.search).get('presentationId'));
    // @ts-ignore
    appState.currentSlideIndex.set(Number(new URLSearchParams(globalThis.location.search).get('currentSlide') || '0' ));
    setLoaded(true);
  },[]);

  if(!loaded) {
    return <div>Loading ... </div>
  }

  return (

    <QueryClientProvider client={queryClient}>
      <SalesforceProvider>
      <ThemeProvider theme={theme}>

       <Home />
       </ThemeProvider>
      </SalesforceProvider>
      {/* <ReactQueryDevtools initialIsOpen={true} /> */}
      <ToastContainer /> 
    </QueryClientProvider>
  );
}

// Enable HMR
if (module.hot) {
  module.hot.accept();
}

export default App;
