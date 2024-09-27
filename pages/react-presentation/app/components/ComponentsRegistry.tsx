import { R } from '@tanstack/react-query-devtools/build/legacy/devtools-PtxSnd7z';
import React from 'react';

export const components = {
  // lets lazy load the utility profile
  'c/presentation_utility_profile': React.lazy(
    () => import('../slides/utility-confirmation/PresentationUtilityProfile')
  ),
  'c/presentation_utilityConsumptionProfile': React.lazy(
    () => import('../slides/utility-confirmation/PresentationUtilityProfile')
  ),
  'c/presentation_consumptionChart': ()=><div></div>,
  'c/presentation_consumptionPayment': ()=><div></div>,

  'c/photoUploader':  React.lazy(() => import('../slides/PhotoUploader')),
  'c/sitePinConfirmation':
  React.lazy(() => import('../slides/site-confirmation/index')),
  'c/presentation_site_confirmation':
    React.lazy(() => import('../slides/site-confirmation/index')),
  'c/presentation_wrapup': React.lazy(() => import('../slides/PresentationWrapup')),
  'c/presentation_envelopeDocuments': React.lazy(() => import('../slides/EnvelopeSummary')),
  'c/presentation_envelopeSigners': () => (
    <div>presentation_envelopeSigners : Not yet complete </div>
  ), //React.lazy(() => import('../slides/EnvelopeSigners')),
  'c/lwcLoanProviderQClient': () => (
    <div>lwcLoanProviderQClient : Not yet complete </div>
  ), //React.lazy(() => import('../slides/LoanProviderQClient')),
  'c/presentation_homeowners_v2': React.lazy(
    () => import('../slides/ContactConfirmation')
  ),
  'c/presentation_homeowners':  React.lazy(
    () => import('../slides/ContactConfirmation')
  ),
  'c/tChart': React.lazy(() => import('../slides/TChart')),
  'c/presentation_energyEfficiencyOverview': React.lazy(
    () => import('../slides/EnergyEfficiency')
  ),
  'c/presentation_energyEfficiencyProductDetail': React.lazy(
    () => import('../slides/ProductDetail')
  ),
  'c/presentation_energyEfficiencyCalculator': React.lazy(
    () => import('../slides/EnergyEfficiencyCalculator')
  ),
  'c/lwcPresentationDesignChanger': React.lazy(
    () => import('./PresentationDesignChanger')
  ),
  // 'c/solargrafCharts': React.lazy(() => import('../slides/SolargrafCharts')),
  'c/solargrafCharts': ()=> <div></div>,

  'c/solargrafDetails': React.lazy(() => import('../slides/SolargrafDetails')),
  'c/lwcPresentationPricingSidebar': React.lazy(
    () => import('../slides/PricingSidebar')
  ),
  'c/solargraf3DModel': React.lazy(() => import('../slides/Solargraf3DModel')),
  'c/presentation_productionChart': React.lazy(
    () => import('../slides/ProductionChart')
  ),
  'c/presentation_ftc': React.lazy(() => import('../slides/FTC')),
  'c/presentation_quoteVersions': React.lazy(
    () => import('../slides/QuoteVersions')
  ),
  'c/presentation_quoteSummary': React.lazy(
    () => import('../slides/QuoteSummary')
  ),
  'c/presentation_pricingSummary': React.lazy(
    () => import('../slides/PricingSummary')
  ),
  'c/presentation_manualApproval': React.lazy(
    () => import('../slides/ManualLoanApproval')
  ),
  'c/presentation_loanSelection': React.lazy(
    () => import('../slides/LoanOptionsDisplay')
  ),
};
