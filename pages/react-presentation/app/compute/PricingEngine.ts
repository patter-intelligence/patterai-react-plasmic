import { debounce } from 'lodash';

export interface Product {
  quantity: number;
  product: {
    Id: string;
    Name: string;
    Family__c?: string;
    IsAutoAdder__c: boolean;
    Description__c?: string;
  };
  pricingStrategies: PricingStrategy[];
  isSelected: boolean;
  customValue: number | null;
  cost: number;
}

export interface PricingStrategy {
  BasePrice__c?: number;
  EffectiveDate__c: string;
  RuleType__c: 'CostPerUnit' | 'CostPerWatt' | 'Fixed' | 'Percentage';
  IsModifier__c: boolean;
  AppliesTo__c?: string;
  Value__c?: number;
  TieredPricing__c?: string;
  MinimumValue__c?: number;
  MaximumValue__c?: number;
  isCostPerUnit: boolean;
  isCostPerWatt: boolean;
  isFixedPrice: boolean;
  isDiscount: boolean;
  isAutoAdder: boolean;
  isIncentive: boolean;
  Description__c?: string;
  CustomSettings__c?: any;
  CustomAction__c?:string;
}

export interface ProductWithQuantity {
  productId: string;
  quantity: number;
  customValue: number | null;
}

export interface CostDetail {
  id: string;
  label: string;
  value: number;
  formattedPrice: string;
  additionalInfo?: { id: string; name: string; price: string }[];
}

export class PricingEngine {
  private systemSizeWatts: number;
  private products: Product[];
  private callSalesforceMethod: (
    methodName: string,
    params: any
  ) => Promise<any>;
  private recordId: string;

  constructor(
    systemSizeWatts: number,
    products: Product[],
    callSalesforceMethod: (methodName: string, params: any) => Promise<any>,
    recordId: string
  ) {
    this.systemSizeWatts = systemSizeWatts;
    this.products = this.processProducts(products);
    this.callSalesforceMethod = callSalesforceMethod;
    this.recordId = recordId;
  }

  public async calculateCostDetails(): Promise<CostDetail[]> {
    const totalCost = await this._calculateTotalCost(false);
    const formattedCost = this.formatValue(totalCost || 0);

    const grossProducts = this.products.filter(p => !this.isDiscountOrIncentive(p));
    const discounts = this.products.filter(p => this.isDiscount(p));
    const incentives = this.products.filter(p => this.isIncentive(p));

    const grossSystemCost = grossProducts.reduce((acc, p) => acc + p.cost, 0);
    const totalDiscounts = discounts.reduce((acc, p) => acc + p.cost, 0);
    const financedAmount = grossSystemCost + totalDiscounts;
    

    const details: CostDetail[] = [
      {
        id: 'grossSystemCost',
        label: 'Gross System Cost',
        value: grossSystemCost,
        formattedPrice: this.formatValue(grossSystemCost),
        additionalInfo: grossProducts.filter(k => k.cost > 0).map(p => ({
          id: p.product.Id,
          name: p.product.Name,
          price: this.formatValue(p.cost)
        }))
      },
      {
        id: 'discounts',
        label: 'Discounts',
        value: totalDiscounts,
        formattedPrice: this.formatValue(totalDiscounts),
        additionalInfo: discounts.map(p => ({
          id: p.product.Id,
          name: p.product.Name,
          price: this.formatValue(p.cost)
        }))
      },
      {
        id: 'financedAmount',
        label: 'Financed Amount',
        value: financedAmount,
        formattedPrice: this.formatValue(financedAmount)
      },
      ...incentives.map(p => this.processProduct(p))
    ];

    return details.filter(detail => detail.value !== 0);
  }

  private isDiscountOrIncentive(product: Product): boolean {
    return product.product.Family__c === 'Discounts' || product.product.Family__c === 'Incentives';
  }

  private isDiscount(product: Product): boolean {
    return product.product.Family__c === 'Discounts';
  }

  private isIncentive(product: Product): boolean {
    return product.product.Family__c === 'Incentives';
  }

  private processProduct(product: Product): CostDetail {
    return {
      id: product.product.Id,
      label: product.product.Name,
      value: product.cost,
      formattedPrice: this.formatValue(product.cost),
      additionalInfo: product.pricingStrategies[0].Description__c 
        ? [{ id: product.product.Id, name: product.pricingStrategies[0].Description__c, price: '' }] 
        : undefined
    };
  }

  public formatValue(value: number): string {
    const sign = value < 0 ? '-' : '';
    const absValue = Math.abs(value);
    const formattedValue = absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return sign === '-' ? `($${formattedValue})` : `$${formattedValue}`;
  }

  private processProducts(products: Product[]): Product[] {
    const processedProducts = products.map((productR) => {
      const product = { ...productR };
      const pricingStrategies = [...product.pricingStrategies];
      product.pricingStrategies = pricingStrategies;
      product.pricingStrategies[0] = {
        ...product.pricingStrategies[0],
        isCostPerUnit: false,
        isCostPerWatt: false,
        isFixedPrice: false,
        isDiscount: false,
      };

      product.pricingStrategies[0].isCostPerUnit =
        product.pricingStrategies[0].RuleType__c === 'CostPerUnit';
      product.pricingStrategies[0].isCostPerWatt =
        product.pricingStrategies[0].RuleType__c === 'CostPerWatt';
      product.pricingStrategies[0].isFixedPrice =
        product.pricingStrategies[0].RuleType__c === 'Fixed';
      product.pricingStrategies[0].isDiscount = this.isDiscount(product);
      product.pricingStrategies[0].isIncentive = this.isIncentive(product);
      product.pricingStrategies[0].isAutoAdder = product.product.IsAutoAdder__c;

      return product;
    });

    // Sort by name
    processedProducts.sort((a, b) => {
      if (a.product.Name < b.product.Name) {
        return -1;
      }
      if (a.product.Name > b.product.Name) {
        return 1;
      }
      return 0;
    });

    return processedProducts;
  }

  private readTier(tier: string) {
    const [quantity, pricePerUnit] = tier.split(':').map(part => part.trim());
    return {
      quantity: parseFloat(quantity),
      pricePerUnit: parseFloat(pricePerUnit)
    };
  }

  private calculateTieredPricing(
    ruleType: string,
    tieredPricing: string,
    quantity: number,
    systemSizeWatts: number
  ): number {
    try {
      console.log('tieredPricing:', tieredPricing);
      console.log('ruleType:', ruleType);
      console.log('quantity:', quantity);
      console.log('systemSizeWatts:', systemSizeWatts);

      const tiers = tieredPricing.split(';').map(this.readTier);
      tiers.sort((a, b) => a.quantity - b.quantity);

      const applicableQuantity = ruleType === 'CostPerWatt' ? systemSizeWatts / 1000 : quantity;

      let bestPrice = tiers[0].pricePerUnit; // Default to first tier price

      for (const tier of tiers) {
        if (applicableQuantity >= tier.quantity) {
          bestPrice = tier.pricePerUnit;
        } else {
          break;
        }
      }

      console.log('Selected tier price:', bestPrice);

      const totalPrice = ruleType === 'CostPerWatt'
        ? bestPrice * systemSizeWatts / 1000
        : bestPrice * quantity;

      console.log('Total calculated price:', totalPrice);

      return totalPrice;
    } catch (e:any) {
      console.error('Error calculating tiered pricing:', e);
      throw new Error('Error calculating tiered pricing: ' + e.message);
    }
  }

  private async calculateProductCost(product: Product): Promise<number> {
    let cost = 0;
    const pricingStrategy = product.pricingStrategies[0];
    let basePrice = pricingStrategy.BasePrice__c || pricingStrategy.Value__c || 0;
    const customValue = product.customValue;

    if (pricingStrategy.TieredPricing__c) {
      const tieredPricing = this.calculateTieredPricing(
        pricingStrategy.RuleType__c,
        pricingStrategy.TieredPricing__c,
        product.quantity,
        this.systemSizeWatts
      );

      if (tieredPricing) {
        basePrice = tieredPricing || 0;
        product.cost = basePrice;
        return basePrice;
      }
    }

    if (pricingStrategy.CustomAction__c && pricingStrategy.CustomSettings__c) {
      console.log('PricingEngine', 'CustomAction__c', JSON.stringify(pricingStrategy));
      const action = pricingStrategy.CustomAction__c;
      if (action === 'PricingEngine.calculateSRECPayment') {
        const productCost = await this.callSalesforceMethod('PricingEngine.calculateSRECPayment', { salesOpportunityId: this.recordId });
        if (productCost.srecPayment) {
          basePrice = productCost.srecPayment;
        }
        product.cost = Math.abs(basePrice) * -1;
        return product.cost;
      }
    }

    if (customValue !== null && pricingStrategy.AppliesTo__c !== 'Gross') {
      basePrice = Number(customValue);
      if (pricingStrategy.isDiscount) {
        basePrice = Math.abs(basePrice) * -1;
      }
      product.cost = basePrice;
      return product.cost;
    }

    if (pricingStrategy.isDiscount) {
      console.log('isDiscount', JSON.stringify(pricingStrategy));
      if (pricingStrategy.AppliesTo__c !== 'Gross') {
        if (pricingStrategy.RuleType__c === 'Percentage' && pricingStrategy.AppliesTo__c !== 'Gross') {
          console.log('isDiscount Percentage !Gross', { basePrice, customValue, product });
          basePrice = Math.abs(basePrice) * -1;
        } else {
          console.log('isDiscount', { basePrice, customValue, product });
          basePrice = Math.abs(basePrice) * -1;
        }
      } else {
        console.log('PricingEngine', 'cannot apply discount to gross on this product', JSON.stringify(pricingStrategy));
      }
    }

    if (pricingStrategy.isCostPerUnit) {
      cost = basePrice * product.quantity;
    } else if (pricingStrategy.isCostPerWatt) {
      cost = basePrice * this.systemSizeWatts;
    } else if (pricingStrategy.isFixedPrice) {
      cost = basePrice;
    }

    product.cost = cost;
    return cost;
  }

  public _calculateTotalCost = async (
    updateQuoteLineItems = true
  ): Promise<number> => {
    let totalCost = 0;
    const productsWithQuantity: ProductWithQuantity[] = [];

    for (const product of this.products) {
      if (product.isSelected || product.quantity > 0 || (product.isSelected && product.customValue !== null && !isNaN(product.customValue))) {
        const finalCost = await this.calculateProductCost(product);
        totalCost += finalCost;
      }

      productsWithQuantity.push({
        productId: product.product.Id,
        quantity: product.quantity || 0,
        customValue: product.customValue || null,
      });
    }

    for (const product of this.products) {
      if (product.isSelected || product.quantity > 0 || (product.isSelected && product.customValue !== null && !isNaN(product.customValue))) {
        if (product.pricingStrategies[0].AppliesTo__c === 'Gross') {
          const pricingStrategy = product.pricingStrategies[0];
          const value = pricingStrategy.Value__c || 0;
          let productCost = 0;

          if (pricingStrategy.isDiscount || pricingStrategy.isIncentive) {
            console.log('isDiscount', JSON.stringify(pricingStrategy));

            if (pricingStrategy.RuleType__c === 'Percentage') {
              const percentage = value / 100;
              productCost = totalCost * percentage * -1;
            } else {
              productCost = value * -1;
            }

            const totalCostBeforeDiscount = totalCost;
            product.cost = productCost;
            product.customValue = productCost;
            totalCost += productCost;

            console.log('PricingEngine',
              'isDiscount', JSON.stringify({ totalCostBeforeDiscount, totalCost, value, productCost }));

            productsWithQuantity.push({
              productId: product.product.Id,
              quantity: product.quantity || 0,
              customValue: product.cost || product.customValue || null,
            });
          } else {
            throw new Error('Unsupported pricing strategy');
          }
        }
      }
    }

    if (updateQuoteLineItems) {
      try {
        await this.callSalesforceMethod('PricingEngine.addOrUpdateProducts', {
          salesOpportunityId: this.recordId,
          products: JSON.stringify(productsWithQuantity),
        });
      } catch (e) {
        console.log('Error in calculateTotalCost', JSON.stringify(e));
      }
    }

    console.log('Total Cost calculated in PricingEngine:', totalCost);
    return isNaN(totalCost) ? 0 : totalCost;
  };

  // debounced version of _calculateTotalCost
  public calculateTotalCost = debounce(this._calculateTotalCost, 500);

  // public calculateTotalCost = debounce(
  //   async (updateQuoteLineItems = true): Promise<number> => {
  //     let totalCost = 0;
  //     const productsWithQuantity: ProductWithQuantity[] = [];

  //     try {
  //       // First pass: calculate costs for non-gross products
  //       this.products.forEach((product) => {
  //         if (
  //           product.isSelected ||
  //           product.quantity > 0 ||
  //           (product.isSelected && product.customValue !== null)
  //         ) {
  //           if (product.pricingStrategies[0].AppliesTo__c !== 'Gross') {
  //             const cost = this.calculateProductCost(product);
  //             totalCost += cost;
  //           }

  //           productsWithQuantity.push({
  //             productId: product.product.Id,
  //             quantity: product.quantity || 0,
  //             customValue: product.customValue || null,
  //           });
  //         }
  //       });

  //       // Second pass: apply gross discounts
  //       this.products.forEach((product) => {
  //         if (
  //           (product.isSelected ||
  //             product.quantity > 0 ||
  //             (product.isSelected && product.customValue !== null)) &&
  //           product.pricingStrategies[0].AppliesTo__c === 'Gross'
  //         ) {
  //           const pricingStrategy = product.pricingStrategies[0];
  //           const value = pricingStrategy.Value__c || 0;

  //           if (pricingStrategy.isDiscount) {
  //             let productCost = 0;
  //             if (pricingStrategy.RuleType__c === 'Percentage') {
  //               const percentage = value / 100;
  //               productCost = totalCost * percentage * -1;
  //             } else {
  //               productCost = value * -1;
  //             }

  //             product.cost = productCost;
  //             product.customValue = productCost;
  //             totalCost += productCost;

  //             productsWithQuantity.push({
  //               productId: product.product.Id,
  //               quantity: product.quantity || 0,
  //               customValue: product.cost || product.customValue || null,
  //             });
  //           }
  //         }
  //       });

  //       if (updateQuoteLineItems) {
  //         await this.callSalesforceMethod('PricingEngine.addOrUpdateProducts', {
  //           salesOpportunityId: this.recordId,
  //           products: JSON.stringify(productsWithQuantity),
  //         });
  //       }

  //       console.log('Total Cost calculated in PricingEngine:', totalCost);

  //       return isNaN(totalCost) ? 0 : totalCost;
  //     } catch (e) {
  //       console.error('Error in calculateTotalCost', e);
  //       return 0;
  //     }
  //   },
  //   500
  // );

  public updateProduct(productId: string, updates: Partial<Product>): void {
    this.products = this.products.map((product) =>
      product.product.Id === productId ? { ...product, ...updates } : product
    );
  }

  public getProducts(): Product[] {
    return this.products;
  }

  public setSystemSizeWatts(size: number): void {
    this.systemSizeWatts = size;
  }
}
