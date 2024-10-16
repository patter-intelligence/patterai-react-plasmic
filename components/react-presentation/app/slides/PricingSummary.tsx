import React, { useState, useEffect } from 'react';
import {
  useDirectSalesforceAction,
  useSalesforceAction,
} from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import { observer } from '@legendapp/state/react';
import './PricingSummary.module.css';
import { PricingEngine, Product, CostDetail } from '../compute/PricingEngine';

const PricingSummary: React.FC = observer(() => {
  const [costDetails, setCostDetails] = useState<CostDetail[]>([]);
  const [netSystemCost, setNetSystemCost] = useState('$0.00');
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [pricingEngine, setPricingEngine] = useState<PricingEngine | null>(
    null
  );
  const [expandAll, setExpandAll] = useState(false);
  const [isCalculating, setIsCalculating] = useState(true);
  const recordId = appState.recordId.get();

  const {
    result: productsWithPricing,
    loading: productsLoading,
    error: productsError,
  } = useDirectSalesforceAction<Product[]>(
    'PricingEngine.fetchProductsWithPricing',
    { salesOpportunityId: recordId },
    true
  );

  const {
    result: systemSize,
    loading: systemSizeLoading,
    error: systemSizeError,
  } = useDirectSalesforceAction<number>(
    'PricingEngine.getSystemSizekW',
    { salesOpportunityId: recordId },
    true
  );

  const { executeAction: callSalesforceMethod } = useSalesforceAction();

  useEffect(() => {
    if (productsWithPricing && systemSize) {
      const engine = new PricingEngine(
        systemSize * 1000, // Convert kW to Watts
        productsWithPricing,
        callSalesforceMethod,
        recordId
      );
      setPricingEngine(engine);
    }
  }, [productsWithPricing, systemSize, recordId, callSalesforceMethod]);

  useEffect(() => {
    const calculateCostDetails = async () => {
      if (!pricingEngine) return;

      setIsCalculating(true);
      const details = await pricingEngine.calculateCostDetails();
      setCostDetails(details);

      const totalCost = await pricingEngine._calculateTotalCost(false);
      setNetSystemCost(pricingEngine.formatValue(totalCost || 0));
      setIsCalculating(false);
    };

    if (pricingEngine) {
      calculateCostDetails();
    }
  }, [pricingEngine]);

  const handleToggleSection = (sectionId: string) => {
    setOpenItems((prevOpenItems) =>
      prevOpenItems.includes(sectionId)
        ? prevOpenItems.filter((item) => item !== sectionId)
        : [...prevOpenItems, sectionId]
    );
  };

  const handleToggleAll = () => {
    setExpandAll(!expandAll);
    setOpenItems(expandAll ? [] : costDetails.map((detail) => detail.id));
  };

  if (productsLoading || systemSizeLoading || isCalculating) {
    return (
      <div className="ps-pricing-summary-card">
        <h2 className="h1-semi fade-in heading ps-pricing-summary-title">Pricing Summary</h2>
        <div className="ps-loading-container">
          <div className="ps-loading-spinner"></div>
          <p className="ps-d2-medium ps-loading-text">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  if (productsError || systemSizeError) {
    return (
      <div className="ps-pricing-summary-card">
        <h2 className="h1-semi fade-in heading ps-pricing-summary-title">Pricing Summary</h2>
        <p className="ps-error-message">
          Error loading pricing data. Please try again.
        </p>
      </div>
    );
  }

  if (!productsWithPricing || productsWithPricing.length === 0) {
    return (
      <div className="ps-pricing-summary-card">
        <h2 className="h1-semi fade-in heading ps-pricing-summary-title">Pricing Summary</h2>
        <p className="ps-d2-medium">No pricing data available.</p>
      </div>
    );
  }

  return (
    <div className="ps-pricing-summary-card">
      <h2 className="h1-semi fade-in heading ps-pricing-summary-title">Pricing Summary</h2>
     
      <div className="ps-pricing-summary-content">
        {costDetails.map((detail) => (
          <div key={detail.id} className="ps-accordion-section">
            <div
              className={`ps-accordion-header ${
                openItems.includes(detail.id) ? 'ps-open' : ''
              }`}
              onClick={() => handleToggleSection(detail.id)}
            >
              <span className="ps-d1-semi">{detail.label}</span>
              <span className="ps-cost ps-d1-medium">{detail.formattedPrice}</span>
              {detail.additionalInfo ? (
                <span
                  className={`ps-chevron ${
                    openItems.includes(detail.id) ? 'ps-open' : ''
                  }`}
                ></span>
              ):<span
              className={`ps-chevron `}
              style={{opacity:0}}
            ></span> }
            </div>
            {detail.additionalInfo && (
              <div
                className={`ps-accordion-content ${
                  openItems.includes(detail.id) ? 'ps-open' : ''
                }`}
              >
                <div className="ps-additional-info-container">
                  {detail.additionalInfo.map((info) => (
                    <div key={info.id} className="ps-additional-info-row">
                      <span className="ps-d2-medium ps-additional-info-name">
                        {info.name}
                      </span>
                      <span className="ps-d2-medium ps-additional-info-price">
                        {info.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="ps-total-cost">
          <div className="ps-accordion-header-no-highlight">
            <span className="ps-h3-semi">Net System Cost</span>
            <span className="ps-cost ps-h3-medium">{netSystemCost}</span>
          </div>
        </div>
      </div>
      <button className="ps-expand-collapse-btn" onClick={handleToggleAll}>
        {expandAll ? 'Collapse All' : 'Expand All'}
      </button>
    </div>
  );
});

export default PricingSummary;
