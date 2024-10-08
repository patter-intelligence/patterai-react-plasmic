import React, { Suspense, useEffect, useState } from 'react';
import './EnergyEfficiency.module.css';

import ProductDetail from './ProductDetail';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import { observer } from '@legendapp/state/react';
import { appState } from '../state/appState';
import Loader from '../components/Loader';
import { IEnergyEfficientProduct } from '../types';

export interface Product {
  name: string;
  image: string;
  imageLarge?: string;
  description: string;
  benefits: string[];
  potentialSavings: number;
  kWhSavings: number;
  id?: string;
}

const AirSeal = '/assets/overview/Air Seal.png';
const HVACSeal =  '/assets/overview/HVAC Seal.png';
const WaterHeaterBlanket =  '/assets/overview/Water Heater Blanket.png';
const AtticTent =  '/assets/overview/Attic Tent.png';
const NestThermostat =  '/assets/overview/Smart Thermostat.png';
const LEDLightbulbs =  '/assets/overview/LED Lightbulbs.png';
const BlownInInsulation =  '/assets/overview/Air Blown Insulation.png';
const NestThermostatLarge =  '/assets/Nest Thermostat-Large.png';
const InsulationLarge =  '/assets/Insulation.png';

export const ENERGY_EFFICIENCY_PRODUCTS: Product[] = [
  {
    name: 'Nest Thermostat',
    image: NestThermostat,
    imageLarge: NestThermostatLarge,
    description:
      "Smart thermostat to optimize your home's heating and cooling.",
    benefits: [
      'Adjust temp when you are away right from your phone',
      'Save up to 10-12% on heating costs and up to 15% on cooling costs',
    ],
    potentialSavings: 206.93,
    kWhSavings: 1883,
    id: '1',
  },
  {
    name: 'Air Seal House', // Name
    image: AirSeal, // Image__c
    imageLarge: InsulationLarge, // ImageLarge__c
    description: "Improve your home's energy efficiency by sealing air leaks.", //Description__c
    benefits: [
      // Settings__c.benefits
      'Reduces drafts and improves comfort',
      'Lowers energy bills',
      'Prevents moisture and pest intrusion',
    ],
    potentialSavings: 150.0, // Settings__c.potentialSavings
    kWhSavings: 1500, // Settings__c.kWhSavings
    id: '2', // Id
  },
  {
    name: 'HVAC Duct Seal',
    image: HVACSeal,
    imageLarge: InsulationLarge,
    description:
      'Seal your HVAC ducts to prevent energy loss and improve system efficiency.',
    benefits: [
      'Increases HVAC system efficiency',
      'Improves indoor air quality',
      'Reduces energy waste',
    ],
    potentialSavings: 180.0,
    kWhSavings: 1600,
    id: '3',
  },
  {
    name: 'Water Heater Blanket',
    image: WaterHeaterBlanket,
    description:
      'Insulate your water heater to reduce heat loss and save energy.',
    benefits: [
      'Reduces standby heat loss',
      'Extends water heater lifespan',
      'Quick and easy installation',
    ],
    potentialSavings: 50.0,
    kWhSavings: 500,
    id: '4',
  },
  {
    name: 'Attic Tent',
    image: AtticTent,
    description:
      'Install an attic tent to prevent air leakage through the attic access.',
    benefits: [
      'Blocks air infiltration from attic',
      'Improves overall insulation',
      'Easy to install and remove',
    ],
    potentialSavings: 75.0,
    kWhSavings: 750,
    id: '5',
  },
  {
    name: 'LED Lightbulbs',
    image: LEDLightbulbs,
    description:
      'Energy-efficient LED bulbs to reduce electricity consumption.',
    benefits: [
      'Uses up to 75% less energy than incandescent bulbs',
      'Lasts 25 times longer than traditional bulbs',
      'Produces less heat, reducing cooling costs',
    ],
    potentialSavings: 100.0,
    kWhSavings: 1000,
    id: '6',
  },
  {
    name: 'Blown-In Insulation',
    image: BlownInInsulation,
    description:
      "Improve your home's insulation with blown-in material for better energy efficiency.",
    benefits: [
      'Fills gaps and hard-to-reach areas effectively',
      'Improves overall home comfort',
      'Reduces heating and cooling costs',
    ],
    potentialSavings: 200.0,
    kWhSavings: 2000,
    id: '7',
  },
];

// var products = await getProducts({
//   salesOpportunityId: this.recordId,
//   productFamily: "Energy Efficiency"
// })



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

const EnergyEfficiency: React.FC = observer(() => {
  const [isLoading, setIsLoading] = useState(true);

  const [products, setProducts] = useState<IEnergyEfficientProduct[]>([]);

  const recordId = appState.recordId.get();
  // load products from Salesforce
  const { refetch: getProducts } = useDirectSalesforceAction(
    'ProductService.getProductsByFamily',
    {
      salesOpportunityId: recordId,
      family: 'Energy Efficiency',
    }
  );

  useEffect(() => {
    getProducts().then((products: IEnergyEfficientProduct[]) => {
      console.log(products);
      // TODO: this is a hack, need to fix this
      products = products.filter((product) => product.Name !== 'Energy Efficiency');
      setProducts(products);
      setIsLoading(false);
    });
  }, []);

  const handleProductClick = (index: number) => {
    // setSelectedProduct(index);
  };

  return (
    <>
      {isLoading && (
        <Loader
          contextVariables={{
            LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
            COMPANY_NAME: 'Patter AI',
          }}
        ></Loader>
      )}
      <Suspense fallback={<Loader
          contextVariables={{
            LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
            COMPANY_NAME: 'Patter AI',
          }}
        ></Loader>}>
      <div className="ee-container-energy-efficiency">
        <div className="ee-products">
          <div className="ee-products-grid">
            {products.map((product, index) => (
              <div
                key={index}
                className="ee-product-card"
                onClick={() => handleProductClick(index)}
              >
                <div className="ee-product-image-container">
                  <img
                    src={product.Image__c}
                    alt={product.Name}
                    className="ee-product-image"
                  />
                  <div className="ee-product-title">{product.Name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="ee-info">
          <h1 className="ee-h1-patter">Energy Efficiency</h1>
          <p className="ee-subtitle">
            Reduce before you produce with our suite of complimentary energy
            efficiency products
          </p>
        </div>
      </div>
      </Suspense>
    </>
  );
});

export default EnergyEfficiency;
