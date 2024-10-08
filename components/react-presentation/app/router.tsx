import { createBrowserRouter } from "react-router-dom";
import { Home } from "./components/Home";
import { Layout } from "./components/Layout";
import { Suspense, lazy } from 'react';

// import { importRemote } from '@module-federation/utilities';

// import type DashboardModuleType from 'mfe-dashboard/Module';
// import type AccountsModuleType from 'mfe-accounts/Module';
// import type PaymentsModuleType from 'mfe-payments/Module';
// import type EnergyConsumptionModuleType from 'mfe-energy-consumption/Module';
// import type SettingsPanelType from 'mfe-settings/SettingsPanel';

import useSyncAppRouter from './hooks/useSyncAppRouter';


// static module loading
// const MfeDashboard = React.lazy(() => import('mfe-dashboard/Module'));

// dynamic module loading
// NOTE: if you provided changes in remote loaded dynamically, you need to restart host
// export const MfeDashboard = lazy(() =>
//   importRemote<{ default: typeof DashboardModuleType }>({
//     url: async () => Promise.resolve('http://localhost:4205'),
//     scope: 'mfe-dashboard',
//     module: './Module',
//     remoteEntryFileName: 'remoteEntry.js',
//     esm: true,
//   })
// );

// // static module loading
// // const MfeAccounts = React.lazy(() => import('mfe-accounts/Module'));

// export const MfeAccounts = lazy(() =>
//   importRemote<{ default: typeof AccountsModuleType }>({
//     url: async () => Promise.resolve('http://localhost:4204'),
//     scope: 'mfe-accounts',
//     module: './Module',
//     remoteEntryFileName: 'remoteEntry.js',
//     esm: true,
//   })
// );

// static module loading
// const MfeSettings = React.lazy(() => import('mfe-settings/Module'));

// dynamic module loading
// this is whole module
// const MfeSettings = React.lazy(() =>
//   importRemote<{ default: typeof SettingsModuleType }>({
//     url: async () => Promise.resolve('http://localhost:4207'),
//     scope: 'mfe-settings',
//     module: './Module',
//     remoteEntryFileName: 'remoteEntry.js',
//     esm: true,
//   })
// );

// this is component from remote
// const MfeSettingsPanel = lazy(() =>
//   importRemote<{ default: typeof SettingsPanelType }>({
//     url: async () => Promise.resolve('http://localhost:4207'),
//     scope: 'mfe-settings',
//     module: './SettingsPanel', // specified in remote module-federation
//     remoteEntryFileName: 'remoteEntry.js',
//     esm: true,
//   })
// );

// static module loading
// const MfePayments = React.lazy(() => import('mfe-payments/Module'));

// dynamic module loading
// export const MfePayments = lazy(() =>
//   importRemote<{ default: typeof PaymentsModuleType }>({
//     url: async () => Promise.resolve('http://localhost:4206'),
//     scope: 'mfe-payments',
//     module: './Module',
//     remoteEntryFileName: 'remoteEntry.js',
//     esm: true,
//   })
// );

// export const MfeEnergyConsumption = lazy(() =>
//   importRemote<{ default: typeof EnergyConsumptionModuleType }>({
//     url: async () => Promise.resolve('http://localhost:4208'),
//     scope: 'mfe-energy-consumption',
//     module: './Module',
//     remoteEntryFileName: 'remoteEntry.js',
//     esm: true,
//   })
// );

// sync router between host and remote
// check useSyncAppRouter and useGlobalRouter hooks
export const SettingsRouterHandler = () => {
  useSyncAppRouter({ basepath: '/settings' });

  return (
    <Suspense>
      {/* <MfeSettingsPanel /> */}
    </Suspense>
  );
};


// export const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <Layout />,
//     children: [
//       {
//         index: true,
//         path: '/',
//         element: <Home />,
//       },
//       {
//         path: '/dashboard',
//         element: (
//           <Suspense>
//             {/* <MfeDashboard /> */}
//           </Suspense>
//         ),
//       },
//     //   {
//     //     path: '/energy-consumption',
//     //     element: (
//     //       <Suspense>
//     //         <MfeEnergyConsumption />
//     //       </Suspense>
//     //     ),
//     //   },
//       {
//         path: '/accounts',
//         element: (
//           <Suspense>
//             {/* <MfeAccounts /> */}
//           </Suspense>
//         ),
//       },
//       {
//         path: '/payments',
//         element: (
//           <Suspense>
//             {/* <MfePayments /> */}
//           </Suspense>
//         ),
//       },
//       {
//         path: '/settings/*',
//         element: <SettingsRouterHandler />,
//       },
//     ],
//   },
// ]);
