import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PricingSidebar.module.css';
import {
  useDirectSalesforceAction,
  useSalesforceAction,
} from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import { observer } from '@legendapp/state/react';
import { CloseIcon, GearIcon, SearchIcon } from '../components/Icons';
import { PricingEngine, Product } from '../compute/PricingEngine';
import { formatPrice, formatNumber } from '../components/ui/utils';

interface PresentationPricingSidebarProps {
  recordId: string;
  onLoadingChange: (isLoading: boolean) => void;
}

const PresentationPricingSidebar: React.FC<PresentationPricingSidebarProps> =
  observer(({ onLoadingChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [systemSizeWatts, setSystemSizeWatts] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pricingEngine, setPricingEngine] = useState<PricingEngine | null>(
      null
    );
    const [defaultProductId, setDefaultProductId] = useState<string | null>(null);

    const recordId = appState.recordId.get();

    const { refetch: fetchProductsWithPricing } = useDirectSalesforceAction(
      'PricingEngine.fetchProductsWithPricing',
      { salesOpportunityId: recordId }
    );

    const { executeAction: callSalesforceMethod } = useSalesforceAction();

    const { executeAction: getDefaultProduct } = useDirectSalesforceAction(
      'ProductService.getDefaultProduct',
      { salesOpportunityId: recordId }
    );

    const toggleOverlay = () => {
      setIsOpen(!isOpen);
    };

    const calculateTotalCost = async (updateQuoteLineItems = true) => {
      if (pricingEngine) {
        const cost = await pricingEngine._calculateTotalCost(
          updateQuoteLineItems
        );
        if (typeof cost === 'number' && !isNaN(cost)) {
          setTotalCost(cost);
          console.log('Total Cost set:', cost);
        } else {
          console.error('Invalid total cost calculated:', cost);
          setTotalCost(0);
        }
      }
    };

    const handleQuantityChange = (productId: string, newQuantity: number) => {
      if (pricingEngine) {
        pricingEngine.updateProduct(productId, {
          quantity: newQuantity,
          isSelected: newQuantity > 0,
        });
        setProducts(pricingEngine.getProducts());
        calculateTotalCost();
      }
    };

    const handleFixedPriceChange = (productId: string, isSelected: boolean) => {
      if (pricingEngine && productId !== defaultProductId) {
        pricingEngine.updateProduct(productId, {
          isSelected,
          quantity: isSelected ? 1 : 0,
        });
        setProducts(pricingEngine.getProducts());
        calculateTotalCost();
      }
    };

    const handleCustomValuePriceChange = (productId: string, value: number) => {
      if (pricingEngine) {
        pricingEngine.updateProduct(productId, {
          customValue: value,
          isSelected: true,
        });
        setProducts(pricingEngine.getProducts());
        calculateTotalCost();
      }
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(event.target.value);
    };

    const filteredProducts = products
      .filter(
        (product) =>
          product.pricingStrategies && product.pricingStrategies.length > 0
      )
      .filter(
        (product) =>
          product.product.Name.toLowerCase().includes(
            searchText.toLowerCase()
          ) ||
          (product.product.Description__c &&
            product.product.Description__c.toLowerCase().includes(
              searchText.toLowerCase()
            ))
      );

    const { executeAction: getSystemSize } = useDirectSalesforceAction(
      'PricingEngine.getSystemSizekW',
      { salesOpportunityId: recordId }
    );

    const fetchProducts = useCallback(async () => {
      setLoadingMessage('Fetching product details...');
      setIsLoading(true);
      try {
        const systemSize = await getSystemSize();
        setSystemSizeWatts(systemSize);

        const result: Product[] = await fetchProductsWithPricing();

        const defaultProduct = await getDefaultProduct({
          salesOpportunityId: recordId,
        });
        setDefaultProductId(defaultProduct.Id);

        const engine = new PricingEngine(
          systemSize * 1000, // Convert kW to Watts,
          result,
          callSalesforceMethod,
          recordId
        );
        setPricingEngine(engine);
        setProducts(engine.getProducts());

        calculateTotalCost();
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    }, [recordId]);

    useEffect(() => {
      fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
      if (pricingEngine) {
        calculateTotalCost(false);
      }
    }, [pricingEngine]);

    useEffect(() => {
      if (pricingEngine) {
        calculateTotalCost(false);
      }
    }, [pricingEngine, products, systemSizeWatts]);

    useEffect(() => {
      console.log('Current total cost:', totalCost);
    }, [totalCost]);

    return (
      <>
        <button className="toggle-icon" onClick={toggleOverlay}>
          {isOpen ? <CloseIcon /> : <GearIcon />}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="presentation-pricing-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="sidebar-content">
                {isLoading ? (
                  <motion.div
                    className="loading-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="spinner"></div>
                    <p className="loading-text">{loadingMessage}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="sidebar-title">Product(s)</h2>
                    <div className="sidebar-info">
                      <h4>
                        System Size: {formatNumber(systemSizeWatts / 1000)} kW
                      </h4>
                      <h4>
                        Total Cost:{' '}
                        {isNaN(totalCost)
                          ? 'Calculating...'
                          : formatPrice(totalCost)}
                      </h4>
                    </div>
                    <div className="search-container">
                      <SearchIcon className="search-icon" />

                      <input
                        type="search"
                        placeholder="Search Products"
                        value={searchText}
                        onChange={handleSearchChange}
                        className="search-input"
                      />
                    </div>
                    <motion.div
                      className="product-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ staggerChildren: 0.1 }}
                    >
                      {filteredProducts.map((product) => (
                        <motion.div
                          key={product.product.Id}
                          className="product-item"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                          }}
                        >
                          <h3 className="product-name">
                            {product.product.Name}
                            {product.product.Id === defaultProductId && (
                              <span className="default-product-label">Default</span>
                            )}
                          </h3>
                          <p className="product-description">
                            {product.product.Description__c}
                          </p>
                          {product.pricingStrategies.map((strategy, index) => (
                            <div key={index} className="pricing-strategy">
                              {strategy.isCostPerUnit && (
                                <div className="input-container">
                                  <span className="input-label">Quantity:</span>
                                  <input
                                    type="number"
                                    value={product.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        product.product.Id,
                                        parseInt(e.target.value)
                                      )
                                    }
                                    placeholder="Quantity"
                                    className="quantity-input"
                                  />
                                </div>
                              )}
                              {(strategy.isCostPerWatt ||
                                strategy.isFixedPrice) && (
                                <div className="toggle-container">
                                  <span>Enabled</span>
                                  <input
                                    type="checkbox"
                                    checked={product.isSelected}
                                    onChange={(e) =>
                                      handleFixedPriceChange(
                                        product.product.Id,
                                        e.target.checked
                                      )
                                    }
                                    className="toggle-input"
                                    disabled={product.product.Id === defaultProductId}
                                  />
                                </div>
                              )}
                              {strategy.IsModifier__c &&
                                strategy.AppliesTo__c !== 'Gross' && (
                                  <div className="input-container">
                                    <span className="input-label">
                                      Custom Value:
                                    </span>
                                    <input
                                      type="number"
                                      value={product.customValue || 0}
                                      onChange={(e) =>
                                        handleCustomValuePriceChange(
                                          product.product.Id,
                                          parseFloat(e.target.value)
                                        )
                                      }
                                      className="custom-value-input"
                                    />
                                  </div>
                                )}
                            </div>
                          ))}
                          {product.isSelected && (
                            <p className="product-price">
                              Price: <span>{formatPrice(product.cost)}</span>
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  });

export default PresentationPricingSidebar;
