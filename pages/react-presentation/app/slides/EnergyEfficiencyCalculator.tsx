import React, { useEffect, useState, Suspense } from 'react';
import ChevronLeft from '../components/ChevronLeft';
import DonutChart from './DonutChart';
import './EnergyEfficiencyCalculator.module.css';
import { appState } from '../state/appState';
import { observer } from '@legendapp/state/react';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import { IEnergyEfficientProduct } from '../types';
import Loader from '../components/Loader';
import { formatNumber } from '../components/ui/utils';
import { formatCurrency } from '../utilities/formatters';

const EnergyEfficiencyCalculator: React.FC = observer(() => {
  const [products, setProducts] = useState<IEnergyEfficientProduct[]>([]);
  const currentProducts = appState.currentProducts;
  const recordId = appState.recordId.get();
  const [isLoading, setIsLoading] = useState(true);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const {
    refetch: fetchProducts,
    // loading,
    error,
  } = useDirectSalesforceAction('PricingEngine.getProductsByFamily', {
    salesOpportunityId: recordId,
    family: 'Energy Efficiency',
  });

  const { refetch: getConsumptionBySalesOpportunityId } =
    useDirectSalesforceAction(
      'ConsumptionService.getConsumptionBySalesOpportunityId',
      { salesOpportunityId: recordId }
    );

  const { refetch: getAnalyses } = useDirectSalesforceAction(
    'AnalysisService.getAnalyses',
    {}
  );

  const { refetch: addOrUpdateProducts } = useDirectSalesforceAction(
    'PricingEngine.addOrUpdateProducts',
    {},
    false
  );

  useEffect(() => {
    setIsLoading(true);

    Promise.all([
      fetchProducts(),
      getConsumptionBySalesOpportunityId({ salesOpportunityId: recordId }),
      getAnalyses({ consumptionId: '', seriesId: '5' }) // We'll update consumptionId later
    ]).then(([fetchedProducts, oldConsumption, analysisData]) => {
      // Process fetched products
      fetchedProducts = (fetchedProducts as IEnergyEfficientProduct[]).map((product) => {
        const currentState = currentProducts[product?.product?.Id].get() ?? {
          qualified: false,
          quantity: product.quantity,
        };
        currentProducts[product?.product?.Id].set({
          ...currentState,
          quantity: product.quantity as any,
        });

        return {
          ...product,
          ...(product as any).product,
        };
      });

      fetchedProducts = fetchedProducts.filter(
        // @ts-ignore
        (product) => product.Name !== 'Energy Efficiency'
      );

      // Calculate total consumption
      let totalConsumption = 0;
      for (const key in oldConsumption) {
        if (key.includes('_kWh__c')) {
          totalConsumption += oldConsumption[key];
        }
      }

      // Update analysis data with correct consumptionId
      getAnalyses({ 
        consumptionId: oldConsumption.Id, 
        seriesId: '5' 
      }).then((updatedAnalysisData) => {
        const averageMonthlyBill = Math.round(
          totalConsumption * updatedAnalysisData[0].Rate__c || 0
        );

        setTotalConsumption(totalConsumption);
        setTotalCost(averageMonthlyBill);

        setProducts(fetchedProducts);
        // Initialize currentProducts state for each product
        fetchedProducts.forEach((product: { Id: string | number }) => {
          if (product.Id && !appState.currentProducts[product.Id].get()) {
            appState.currentProducts[product.Id].set({
              qualified: false,
              quantity: 0,
            });
          }
        });
        setIsLoading(false);
      });
    }).catch((error) => {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    });
  }, [recordId]);

  const handleQuantityChange = async (productId: string, value: number) => {
    const currentState = currentProducts[productId].get() ?? {
      qualified: false,
      quantity: 0,
    };
    currentProducts[productId].set({
      ...currentState,
      quantity: value,
    });

    try {
      await addOrUpdateProducts({
        salesOpportunityId: recordId,
        products: JSON.stringify([
          {
            productId: productId,
            quantity: value,
            customValue: null,
          },
        ]),
      });
    } catch (error) {
      console.error('Error updating FTC:', error);
    }
  };

  const calculateTotalSavings = () => {
    if (products.length === 0) return 0;
    return products.reduce((total, product) => {
      const currentState = currentProducts[product.Id || ''].get() ?? {
        qualified: false,
        quantity: 0,
      };
      return (
        total +
        ((Number(product.Offset__c) / 100) * totalCost || 0) *
          currentState.quantity
      );
    }, 0);
  };

  const calculateTotalKWhSavings = () => {
    if (products.length === 0) return 0;
    return products.reduce((total, product) => {
      const currentState = currentProducts[product.Id || ''].get() ?? {
        qualified: false,
        quantity: 0,
      };
      return (
        total +
        ((Number(product.Offset__c) / 100) * totalConsumption || 0) *
          currentState.quantity
      );
    }, 0);
  };

  const calculatePercentageSavings = () => {
    if (products.length === 0) return 0;
    const totalSavings = calculateTotalSavings();
    const averageElectricBill = 1000; // Assuming an average monthly electric bill of $1000
    return Math.round((totalSavings / (averageElectricBill * 12)) * 100);
  };

  const qualifiedProducts = products.filter((product) => {
    const currentState = currentProducts[product.Id || ''].get() ?? {
      qualified: false,
      quantity: 0,
    };
    return currentState.qualified;
  });
  const unqualifiedProducts = products.filter((product) => {
    const currentState = currentProducts[product.Id || ''].get() ?? {
      qualified: false,
      quantity: 0,
    };
    return !currentState.qualified;
  });

  if (error) {
    return <div>Error loading products: {error.message}</div>;
  }

  const renderContent = () => (
    <div className="info-screen">
      <div className="info-content">
        <div className="info-content-left">
          <div className="savings-card">
            <h2>Potential Savings / Year</h2>
            <p className="savings-amount">
              {isNaN(calculateTotalSavings())
                ? '0.00'
                : formatCurrency(calculateTotalSavings())}
            </p>
            <p className="kwh-savings">
              {isNaN(calculateTotalKWhSavings())
                ? '0'
                : formatNumber(calculateTotalKWhSavings())}{' '}
              kWh
            </p>
          </div>
          <div className="donut-chart-container">
            <DonutChart
              percentage={
                isNaN(calculatePercentageSavings())
                  ? 0
                  : calculatePercentageSavings()
              }
            />
          </div>
        </div>

        <div className="product-quantities">
          <h1 className="h1-patter">Energy Efficiency</h1>

          <h2>Qualified Products</h2>
          <div className="product-quantities-container">
            {qualifiedProducts.map((product) => (
              <div key={product.Id} className="quantity-input-ee">
                <label htmlFor={`quantity-${product.Id}`}>{product.Name}</label>
                <div className="quantity-control-ee">
                  <button
                    className="quantity-button-ee minus"
                    onClick={() => {
                      const currentQuantity =
                        currentProducts[product.Id || ''].get()?.quantity ?? 0;
                      handleQuantityChange(
                        product.Id || '',
                        Math.max(0, currentQuantity - 1)
                      );
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id={`quantity-${product.Id}`}
                    value={
                      currentProducts[product.Id || ''].get()?.quantity ?? 0
                    }
                    onChange={(e) =>
                      handleQuantityChange(
                        product.Id || '',
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                  <button
                    className="quantity-button-ee plus"
                    onClick={() => {
                      const currentQuantity =
                        currentProducts[product.Id || ''].get()?.quantity ?? 0;
                      handleQuantityChange(
                        product.Id || '',
                        currentQuantity + 1
                      );
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h2>Choose your products</h2>
          <div className="product-quantities-container">
            {unqualifiedProducts.map((product) => (
              <div key={product.Id} className="quantity-input-ee">
                <label htmlFor={`quantity-${product.Id}`}>{product.Name}</label>
                <div className="quantity-control-ee">
                  <button
                    className="quantity-button-ee minus"
                    onClick={() => {
                      const currentQuantity =
                        currentProducts[product.Id || ''].get()?.quantity ?? 0;
                      handleQuantityChange(
                        product.Id || '',
                        Math.max(0, currentQuantity - 1)
                      );
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id={`quantity-${product.Id}`}
                    value={
                      currentProducts[product.Id || ''].get()?.quantity ?? 0
                    }
                    onChange={(e) =>
                      handleQuantityChange(
                        product.Id || '',
                        parseInt(e.target.value) || 0
                      )
                    }
                    min="0"
                  />
                  <button
                    className="quantity-button-ee plus"
                    onClick={() => {
                      const currentQuantity =
                        currentProducts[product.Id || ''].get()?.quantity ?? 0;
                      handleQuantityChange(
                        product.Id || '',
                        currentQuantity + 1
                      );
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Suspense
      fallback={
        <Loader
          contextVariables={{
            LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
            COMPANY_NAME: 'Patter AI',
          }}
        />
      }
    >
      {isLoading ? (
        <Loader
          contextVariables={{
            LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
            COMPANY_NAME: 'Patter AI',
          }}
        />
      ) : (
        renderContent()
      )}
    </Suspense>
  );
});

export default observer(EnergyEfficiencyCalculator);
