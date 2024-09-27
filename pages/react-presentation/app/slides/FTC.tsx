import React, { useEffect, useState } from 'react';
import {
  useDirectSalesforceAction
} from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import './FTC.module.css';
import { observer } from '@legendapp/state/react';

const FTC: React.FC = observer(() => {
  const [ftcEnabled, setFtcEnabled] = useState(false);
  const [ftcProductId, setFtcProductId] = useState<string | null>(null);
  const [displayedPercentage, setDisplayedPercentage] = useState(0);

  const recordId = appState.recordId.get();

  const { refetch: getProductsByName } = useDirectSalesforceAction(
    'PricingEngine.getProductsByName',
    {
      productName: 'Federal Tax Incentive',
      salesOpportunityId: recordId,
    }
  );

  const { refetch: addOrUpdateProducts } = useDirectSalesforceAction(
    'PricingEngine.addOrUpdateProducts',
    {},
    false
  );

  useEffect(() => {
    const fetchFTCData = async () => {
      try {
        const ftc = await getProductsByName();

        if (ftc && ftc.length > 0) {
          setFtcProductId(ftc[0].product.Id);
          setFtcEnabled(ftc[0].quantity > 0);

          if (ftc[0].quantity > 0) {
            animatePercentage(30);
          }
        }
      } catch (error) {
        console.error('Error fetching FTC data:', error);
      }
    };

    fetchFTCData();
  }, [ recordId]);

  const handleToggleFTC = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newFtcEnabled = event.target.checked;
    setFtcEnabled(newFtcEnabled);

    if (newFtcEnabled) {
      animatePercentage(30);
    } else {
      animatePercentage(0);
    }

    try {
      await addOrUpdateProducts({
        salesOpportunityId: recordId,
        products: JSON.stringify([
          {
            productId: ftcProductId,
            quantity: newFtcEnabled ? 1 : 0,
            customValue: null,
          },
        ]),
      });
    } catch (error) {
      console.error('Error updating FTC:', error);
    }
  };

  const animatePercentage = (targetPercentage: number) => {
    const duration = 1000;
    const startPercentage = displayedPercentage;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      setDisplayedPercentage(
        Math.round(
          startPercentage + (targetPercentage - startPercentage) * progress
        )
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="ftc-container">
      <div className="ftc-image-container">
        <div className={`ftc-percentage-circle ${ftcEnabled ? 'active' : ''}`}>
          <div className="ftc-percentage-text">
            <span>{ftcEnabled ? `${displayedPercentage}%` : '-'}</span>
          </div>
          <span className="ftc-percentage-year">2024</span>
        </div>
      </div>
      <div className="ftc-content">
        <h1 className="ftc-h1">
          Financial <span className="ftc-underline">Incentives</span>
        </h1>
        <div className="ftc-toggle-container">
          <span className="ftc-d1-semi">Investment Tax Credit (ITC)</span>
          <div className="ftc-toggle-switch">
            <input
              type="checkbox"
              id="ftcToggle"
              className="ftc-toggle-input"
              checked={ftcEnabled}
              onChange={handleToggleFTC}
            />
            <label htmlFor="ftcToggle" className="ftc-toggle-label"></label>
          </div>
        </div>
        <p className="ftc-d1-medium">
          The federal government is providing a dollar-for-dollar tax credit
          that can be claimed on federal income taxes for a percentage of the
          total solar project cost.
        </p>
      </div>
    </div>
  );
});

export default FTC;
