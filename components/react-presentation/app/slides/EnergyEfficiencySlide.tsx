import React, { useState, useEffect } from 'react';
import { appState } from '../state/appState';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import './EnergyEfficiencySlide.module.css';

interface EnergyEfficiencySlideProps {
  showEfficiency: boolean;
  isExpanded: boolean;
  onToggle: (newValue: boolean) => void;
}

const EnergyEfficiencySlide: React.FC<EnergyEfficiencySlideProps> = ({
  showEfficiency,
  isExpanded,
  onToggle,
}) => {
  const [isPackageAdded, setIsPackageAdded] = useState(showEfficiency);
  const [sqrFootage, setSqrFootage] = useState(100);
  const [estimatedSavings, setEstimatedSavings] = useState(0);
  const [energyEfficiencyProducts, setEnergyEfficiencyProducts] = useState<
    any[]
  >([]);

  const recordId = appState.recordId.get();

  const { refetch: getProducts } = useDirectSalesforceAction(
    'PricingEngine.getProducts',
    { salesOpportunityId: recordId, productFamily: 'Energy Efficiency' }
  );

  const { refetch: addOrUpdateProducts } = useDirectSalesforceAction(
    'PricingEngine.addOrUpdateProducts',
    { salesOpportunityId: recordId, products: '[]' }
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await getProducts();
        setEnergyEfficiencyProducts(products);
        const activeProduct = products[0];
        if (activeProduct) {
          setSqrFootage(activeProduct.quantity);
          setIsPackageAdded(activeProduct.quantity > 0);
          updateEstimatedSavings(
            activeProduct.quantity > 0,
            activeProduct.quantity
          );
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [recordId]);

  const updateEstimatedSavings = (
    packageAdded: boolean,
    newSqrFootage: number
  ) => {
    const savings = Math.round(newSqrFootage * 0.05);
    setEstimatedSavings(savings);

    const activeProduct = energyEfficiencyProducts[0];
    if (activeProduct) {
      const productsWithQuantity = [
        {
          productId: activeProduct.product.Id,
          quantity: packageAdded ? newSqrFootage : 0,
          customValue: null,
        },
      ];

      addOrUpdateProducts({
        salesOpportunityId: recordId,
        products: JSON.stringify(productsWithQuantity),
      });

      // Simulating the publish message functionality
      console.log('Publishing system configuration message:', {
        totalEnergyEfficiencyOffset: packageAdded
          ? activeProduct.product.Offset__c
          : 0,
        productId: activeProduct.product.Id,
        quantity: packageAdded ? newSqrFootage : 0,
      });
    }
  };

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIsPackageAdded = event.target.checked;
    setIsPackageAdded(newIsPackageAdded);
    updateEstimatedSavings(newIsPackageAdded, sqrFootage);
    onToggle(newIsPackageAdded);
  };

  const handleSqrFootageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSqrFootage = parseInt(event.target.value, 10) || 0;
    setSqrFootage(newSqrFootage);
    updateEstimatedSavings(isPackageAdded, newSqrFootage);
  };

  return (
    <div className="energy-efficiency-slide">
      <div className="toggle-container">
        <h1 className="toggle-label-ee">Energy Efficiency</h1>
        <label className="toggle">
          <input
            type="checkbox"
            checked={showEfficiency}
            onChange={handleToggleChange}
          />
          <span className="slider"></span>
        </label>
      </div>

      {isExpanded && (
        <div className="dynamic-content">
          <div className="sqr-footage-input">
            <label htmlFor="sqrFootage">Sqr Footage</label>
            <input
              type="number"
              id="sqrFootage"
              value={sqrFootage}
              onChange={handleSqrFootageChange}
            />
          </div>
          {/* <div className="estimated-savings">
            <p>Estimated Savings: ${estimatedSavings}</p>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default EnergyEfficiencySlide;
