import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Product } from './EnergyEfficiency';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import { observer } from '@legendapp/state/react';
// import './ProductDetail.module.css'; // This import is no longer needed
import { IEnergyEfficientProduct } from '../types';
import Loader from '../components/Loader';

const ProgressiveImage = lazy(() => import('react-progressive-graceful-image'));

interface ProductDetailProps {
  product: Product;
  onBackClick: () => void;
  quantities: number[];
  handleQuantityChange: (index: number, value: number) => void;
  calculateTotalSavings: () => number;
  calculateTotalKWhSavings: () => number;
  calculatePercentageSavings: () => number;
}

const BulletPoint: React.FC<{ text: string }> = ({ text }) => (
  <div className="bullet-point">
    <svg
      width="21"
      height="16"
      viewBox="0 0 21 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1 8.5L6.5 14L19.5 1" stroke="#023B95" stroke-width="2" />
    </svg>
    <span>{text}</span>
  </div>
);

const ProductDetail: React.FC<ProductDetailProps> = ({
  product: fauxProduct,
  onBackClick,
  quantities,
  handleQuantityChange,
  calculateTotalSavings,
  calculateTotalKWhSavings,
  calculatePercentageSavings,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [product, setProduct] = useState<IEnergyEfficientProduct | null>(null);

  const recordId = appState.recordId.get();
  const {
    result: productData,
    loading,
    error,
    refetch: fetchProductData,
  } = useDirectSalesforceAction(
    'ProductService.getProductsByName',
    {
      name: fauxProduct.name,
      salesOpportunityId: recordId,
    },
    false
  );

  const { executeAction: updateProduct } = useDirectSalesforceAction(
    'PricingEngine.addOrUpdateProducts',
    {},
    false
  );

  const productState = appState.currentProducts[product?.Id ?? ''].get() ?? {
    qualified: false,
    quantity: 0,
  };

  useEffect(() => {
    fetchProductData().then((product) => {
      if (product && product.length > 0) {
        setProduct({
          ...product[0],
          Custom__c: JSON.parse(product[0].Custom__c),
        });
      } else {
        console.error('Product not found');
      }
    });
  }, [recordId, fauxProduct.name]);

  useEffect(() => {
    if (productData && productData.length > 0 && product?.Id) {
      appState.currentProducts[product?.Id].set({
        qualified: productData[0].quantity > 0,
        quantity: productData[0].quantity,
      });
    }
  }, [productData, product?.Id]);

  if (error) {
    console.error('Error fetching product data:', error);
    return <div>Error loading product data</div>;
  }

  const handleToggleProduct = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newQualifiedStatus = event.target.checked;
    if (product?.Id) {
      const currentState = appState.currentProducts[product?.Id].get() ?? {
        qualified: false,
        quantity: 0,
      };
      appState.currentProducts[product?.Id].set({
        ...currentState,
        qualified: newQualifiedStatus,
      });

      try {
        await updateProduct({
          salesOpportunityId: recordId,
          products: JSON.stringify([
            {
              productId: product?.Id,
              quantity: newQualifiedStatus ? currentState.quantity || 1 : 0,
              customValue: null,
            },
          ]),
        });
      } catch (error) {
        console.error('Error updating product:', error);
      }
    } else {
      console.error('Product ID is undefined');
    }
  };

  const handleInfoClick = () => {
    setShowInfo(true);
  };

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
      {loading ? (
        <Loader
          contextVariables={{
            LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
            COMPANY_NAME: 'Patter AI',
          }}
        />
      ) : (
        <div className="pd-product-detail">
          <div className="pd-product-detail-content">
            <Suspense fallback={<div className="image-placeholder" />}>
              <ProgressiveImage
                src={product?.ImageLarge__c || product?.Image__c || ''}
                placeholder={product?.Image__c || ''}
              >
                {(src: string, loading?: boolean) => (
                  <img
                    className={`pd-product-detail-image ${loading ? 'pd-loading' : 'pd-loaded'}`}
                    src={src}
                    alt={product?.Name}
                  />
                )}
              </ProgressiveImage>
            </Suspense>
            {onBackClick && (
              <div className="pd-back-button-container">
                <button className="pd-back-button" onClick={onBackClick}>
                  Back to products
                </button>
              </div>
            )}
          </div>
          <div className="pd-product-detail-info">
            <h1 className="pd-h1-patter">{product?.Name}</h1>
            <p className="pd-subtitle">{product?.Description__c}</p>
            <div className="pd-product-benefits">
              {product?.Custom__c?.benefits?.map((benefit, index) => (
                <BulletPoint key={index} text={benefit} />
              ))}
            </div>
            <div className="pd-product-toggle-container">
              <div className="pd-product-toggle-switch">
                <input
                  type="checkbox"
                  id={`${product?.Name}Toggle`}
                  className="pd-product-toggle-input"
                  checked={productState.qualified}
                  onChange={handleToggleProduct}
                />
                <label
                  htmlFor={`${product?.Name}Toggle`}
                  className="pd-product-toggle-label"
                ></label>
              </div>
            </div>
          </div>
        </div>
      )}
    </Suspense>
  );
};

export default observer(ProductDetail);
