import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  useDirectSalesforceAction,
} from '../hooks/useSalesforceOperations';
import { formatCurrency } from '../utilities/formatters';
import { observer } from '@legendapp/state/react';
import { appState } from '../state/appState';

// Styled components
const ComparisonContainer = styled.div`
  font-family: Montserrat, sans-serif;
  margin: 0 auto;
  padding: 4rem 2rem;
  background-color: #f4f6f9;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;


const ComparisonTitle = styled.h1`
  font-size: 3rem;
  text-align: center;
  color: #023b95;
  margin-bottom: 3rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const ComparisonGrid = styled.div`
  display: flex;
  justify-content: center;
  gap: 4rem;
  width: 100%;
  max-width: 1200px;
  margin-top: 20px;
`;

const ComparisonColumn = styled.div`
  flex: 1;
  max-width: 450px;
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ComparisonBox = styled.div`
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 3rem 2rem;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.5s ease-out;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  }
`;

const OptionTitle = styled.h2`
  font-size: 2rem;
  text-align: center;
  color: #2a2a2a;
  margin-bottom: 2rem;
  font-weight: 600;
`;

const SvgContainer = styled.div`
  width: 100%;
  margin-bottom: 2rem;
  cursor: pointer;
`;

const CustomSvg = styled.svg`
  height: 2rem;
`;

const ComparisonItem = styled.div<{ isSelected: boolean }>`
  text-align: center;
  margin-bottom: 20px;
  padding: 1.5rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  background-color: ${(props) => (props.isSelected ? 'transparent' : 'transparent')};
  border: ${(props) => (props.isSelected ? '1px solid #01348A' : 'none')};

  &:hover {
    background-color: ${(props) => (props.isSelected ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.03)')};
    transform: scale(1.05);
  }
`;

const ComparisonValue = styled.p`
  font-size: 2rem;
  font-weight: bold;
  color: #383838;
  margin-bottom: 0.75rem;
`;

const ComparisonLabel = styled.h3`
  font-size: 1.2rem;
  color: #444444;
  font-weight: 500;
`;

/*Analyses__r
: 
{totalSize: 74, done: true, records: Array(74)}
April_kWh__c
: 
1480
August_kWh__c
: 
2855
December_kWh__c
: 
1219
February_kWh__c
: 
1120
Id
: 
"a04D4000002iVzgIAE"
January_kWh__c
: 
1200
July_kWh__c
: 
3129
June_kWh__c
: 
2681
March_kWh__c
: 
1300
May_kWh__c
: 
1870
Name
: 
"C-0056"
Net_Avoided_kWh__c
: 
13862.43
November_kWh__c
: 
1230
October_kWh__c
: 
1602
Post_Total_kWh__c
: 
8215.275021
Sales_Opportunity__c
: 
"a0ND40000023bx3MAA"
Sales_Opportunity__r
: 
{attributes: {…}, Id: 'a0ND40000023bx3MAA', Analysis_Fetched__c: true, Design_Initialized__c: true, Genability_Site__c: true}
September_kWh__c
: 
2353
Total_Cost_After_Solar__c
: 
114272.320007
Total_Cost_Before_Solar__c
: 
135269.98
Utility_Provider__c
: 
"Arizona Public Service Co"
Utility_Tariff__c
: 
"Residential - Fixed Energy Charge Plan, Medium Tier"
Version__c
: 
1
attributes
: 
{type: 'Consumption__c', url: '/services/data/v62.0/sobjects/Consumption__c/a04D4000002iVzgIAE'}
lseId__c
: 
"2885"
masterTariffId__c
: 
"3289755"*/

interface ConsumptionData {
  Id: string;
  January_kWh__c: number;
  February_kWh__c: number;
  March_kWh__c: number;
  April_kWh__c: number;
  May_kWh__c: number;
  June_kWh__c: number;
  July_kWh__c: number;
  August_kWh__c: number;
  September_kWh__c: number;
  October_kWh__c: number;
  November_kWh__c: number;
  December_kWh__c: number;
  Analyses__r: {
    records: AnalysisData[];
  };
  Total_Cost_After_Solar__c: number;
  Total_Cost_Before_Solar__c: number;
  Utility_Provider__c: string;
  masterTariffId__c: string;
  Utility_Tariff__c: string;
}

interface AnalysisData {
  Cost__c: number;
  Series_Id__c: string;
}

const EnergyProgramComparison: React.FC = observer(() => {
  // const [recordId, setRecordId] = useState<string | null>(null);
  const [beforeMonthlyPayment, setBeforeMonthlyPayment] = useState<
    number | null
  >(null);
  const [beforeYearCost, setBeforeYearCost] = useState<number | null>(null);
  const [afterMonthlyPayment, setAfterMonthlyPayment] = useState<number | null>(
    null
  );
  const [afterYearCost, setAfterYearCost] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>(
    {}
  );

  const recordId = appState.recordId.get();

  const { refetch: executeConsumptionAction } =
    useDirectSalesforceAction<ConsumptionData>(
      'ConsumptionService.getConsumptionBySalesOpportunityId',
      {
        salesOpportunityId: recordId,
      }
    );

  useEffect(() => {
    const fetchData = async () => {
      if (!recordId) return;

      try {
        //TODO: optimize this, we cannot get all the data at once, we just need the right data from the seriesId
        const consumption = await executeConsumptionAction();

        console.log({ consumption });

        if (consumption) {
          // const analyses = await executeAnalysisAction(
          //   'AnalysisService.getAnalyses',
          //   {
          //     cid: consumption.records[0].Id,
          //     seriesId: '5',
          //   }
          // );

          const analyses = consumption.Analyses__r.records.filter(
            (analysis) => analysis.Cost__c > 0 && analysis.Series_Id__c === '5'
          );

          // console.log({analyses});

          if (analyses) {
            let totalCost = 0;
            for (const analysis of analyses) {
              totalCost += Number(analysis.Cost__c);
            }

            setBeforeYearCost(Math.ceil(totalCost));
            setBeforeMonthlyPayment(
              Number((analyses[0].Cost__c / 12).toFixed(0))
            );
            setAfterMonthlyPayment(
              Math.ceil(Number(analyses[0].Cost__c / 12) + 50)
            );
            setAfterYearCost(
              Math.ceil(
                Math.ceil(Number(analyses[0].Cost__c / 12) + 50) * 12 * 15
              )
            );
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [recordId]);

  const handleSelect = (itemId: string) => {
      // @ts-ignore
    setSelectedItems((prev) => {
      const [itemType, column] = itemId.split('-');
      const otherColumn = column === 'a' ? 'b' : 'a';
      // @ts-ignore
      const otherItemId = `${itemType}-${otherColumn}`;

      // If the item is already selected, deselect it
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }

      // Deselect all items of the same type
      const updatedItems = Object.keys(prev).reduce((acc, key) => {
        if (!key.startsWith(itemType)) {
          //@ts-ignore
          acc[key] = prev[key];
        }
        return acc;
      }, {} as Record<string, boolean>);

      // Add the newly selected item
      return { ...updatedItems, [itemId]: true };
    });
  };

  return (
    <ComparisonContainer>
      <h2 className="h1-semi fade-in heading">Energy Program Comparison</h2>
      <ComparisonGrid>
        <ComparisonColumn>
          <ComparisonBox>
            <OptionTitle>Energy Program A</OptionTitle>
            <ComparisonItem
              isSelected={!!selectedItems['monthly-payment-a']}
              onClick={() => handleSelect('monthly-payment-a')}
            >
              <ComparisonValue>
                {beforeMonthlyPayment !== null
                  ? formatCurrency(beforeMonthlyPayment)
                  : '-'}
              </ComparisonValue>
              <ComparisonLabel>Monthly Payment</ComparisonLabel>
            </ComparisonItem>
            <ComparisonItem
              isSelected={selectedItems['program-type-a']}
              onClick={() => handleSelect('program-type-a')}
              data-id="program-type-a"
            >
              <SvgContainer>
                <CustomSvg viewBox="0 0 1008.2 464.5">
                  <path
                    className="st0"
                    d="M997,196c-3.6-22.2-10.4-43.4-20.4-63.5c-13.2-26.6-31.1-49.8-53.5-69.5c-25.1-22-53.6-38-85.7-47.1 c-11.6-3.3-23.5-5.6-35.5-7.3c-14.5-2.1-29.2-2.9-44-1.7c-18.4,1.4-36.3,5.6-53.7,11.6c-17.7,6.1-34.6,14-50.8,23.3 c-30.5,17.5-58.1,38.8-83.2,63.3c-14.8,14.4-28.6,29.9-42.8,45c-3.5,3.8-6.7,7.9-10.1,12c18.2,14.9,36,29.7,53.9,44.4 c0.6-0.6,0.9-0.9,1.1-1.2c15.1-18.1,30.9-35.4,48.1-51.5c19.9-18.7,41.1-35.6,64.6-49.4c26.9-15.7,55.2-27.5,87-28.2l1.7,0.2 c0,0,0,0,0,0c3.8,0.3,7.3,0.6,10.9,0.8c16.2,0.8,31.8,4.5,46.7,10.6c35,14.2,61.7,37.9,79.8,71.1c12.2,22.3,18.2,46.3,18.7,71.7 c0.2,11.1-0.8,22.2-3.1,33.2c-5,24.3-15.2,46.2-30.6,65.6c-12.8,16.2-28.4,29.3-46.3,39.5c-24.9,14.2-52.1,19.7-80.4,20.4 c-16.2,0.4-32-2.3-47.5-6.9c-23.1-6.9-44.4-17.6-64.4-30.8c-24.6-16.2-46.6-35.5-67-56.7c-18.6-19.4-35.6-40-51.2-61.9 c-16.8-23.5-33.2-47.4-51.5-69.9c-19-23.3-39.2-45.4-61.2-65.8c-24.7-22.8-51.2-43.1-80.7-59.4c-23.7-13.1-48.5-23.1-75-28.6 c-19.8-4.1-39.8-4.3-59.8-2.4c-17.9,1.7-35.3,5.5-52.2,11.5c-31.7,11.2-59.6,28.5-83.6,52c-25.6,25.1-44.3,54.6-55.9,88.5 c-10.2,30-14,60.9-11.2,92.6c2.2,24.9,8.3,48.7,18.4,71.6c12.7,28.5,30.5,53.3,53.4,74.5c18.1,16.8,38.5,30.2,61,40.4 c23.6,10.6,48.3,16.9,74.1,19.1c20.1,1.7,40,1.1,59.8-2.7c24.6-4.6,48-12.7,70.5-23.6c24-11.6,46.4-26,67.4-42.5 c21.6-16.9,41.5-35.7,60.2-55.8c4.3-4.6,8.4-9.3,12.6-14.1c-17.7-15.3-35.2-30.5-52.8-45.8c-0.7,0.7-1.2,1-1.5,1.5 c-13.2,15.1-27.1,29.5-42.1,42.8c-27,23.9-56.2,44.3-89.9,57.6c-21.6,8.6-43.8,13.9-67.2,13.3c-22.6-0.6-44.3-5.1-64.8-14.9 c-34.1-16.3-59.3-41.5-75.4-75.8c-12.3-26.1-16.5-53.6-13.5-82.2c2.4-22.8,9.6-43.9,21.4-63.5c12.4-20.5,28.7-37.4,48.8-50.4 c19.9-12.9,41.5-20.7,65.1-23.9c22.1-3.1,43.4-0.8,64.3,6.6c22.2,7.8,42.4,19.2,61.6,32.7c22.4,15.8,42.6,34.1,61.5,53.8 c16.8,17.6,32.6,36,47,55.6c12.6,17,24.6,34.5,37.1,51.6c24.4,33.3,51.3,64.5,82,92.2c19,17.1,39.2,32.7,61,46.2 c27.4,16.9,56.3,29.9,87.7,37.4c13.6,3.3,27.3,5.6,41.3,5.9c10.7,0.2,21.5-0.1,32.2-1c11.1-1,22.3-2.6,33.3-4.7 c19.8-3.9,38.5-11.1,56.3-20.4c22.9-12.1,43.2-27.6,60.8-46.6c11-11.9,20.7-24.8,28.9-38.8c9-15.2,16.1-31.2,21.3-48.1 c5.7-18.3,8.9-37,9.8-56.1C1000.5,227.3,999.6,211.6,997,196z"
                  />
                </CustomSvg>
              </SvgContainer>
              <ComparisonLabel>Program Type</ComparisonLabel>
            </ComparisonItem>
            <ComparisonItem
      // @ts-ignore
              isSelected={selectedItems['year-cost-a']}
              onClick={() => handleSelect('year-cost-a')}
              data-id="year-cost-a"
            >
              <ComparisonValue>
                {beforeYearCost !== null ? formatCurrency(beforeYearCost) : '-'}
              </ComparisonValue>
              <ComparisonLabel>25yr Cost</ComparisonLabel>
            </ComparisonItem>
          </ComparisonBox>
        </ComparisonColumn>
        <ComparisonColumn>
          <ComparisonBox>
            <OptionTitle>Energy Program B</OptionTitle>
            <ComparisonItem
              isSelected={selectedItems['monthly-payment-b']}
              onClick={() => handleSelect('monthly-payment-b')}
              data-id="monthly-payment-b"
            >
              <ComparisonValue>
                {afterMonthlyPayment !== null
                  ? formatCurrency(afterMonthlyPayment)
                  : '-'}
              </ComparisonValue>
              <ComparisonLabel>Monthly Payment</ComparisonLabel>
            </ComparisonItem>
            <ComparisonItem
              isSelected={selectedItems['program-type-b']}
              onClick={() => handleSelect('program-type-b')}
              data-id="program-type-b"
            >
              <SvgContainer>
                <CustomSvg viewBox="0 0 970.5 357">
                  <path
                    className="st0"
                    d="M76.2,357c-25.7,0-50.8,0-76.2,0C0,238,0,119.2,0,0.1c25.3,0,50.5,0,76.1,0c0,1.3,0,2.4,0,3.5 c0,44.3,0,88.6,0,132.9c0,3.7,0,3.7,3.6,3.7c270.3,0,540.6,0,810.9,0c3.7,0,3.7,0,3.7-3.8c0-44.3,0-88.6,0-132.8 c0-3.5,0-3.5,3.5-3.5c23.2,0,46.3,0,69.5,0c1,0,2,0,3.2,0c0,119.1,0,237.9,0,356.9c-25.3,0-50.5,0-76.1,0c0-46.7,0-93.3,0-140.1 c-272.8,0-545.4,0-818.3,0C76.2,263.5,76.2,310.1,76.2,357z"
                  />
                </CustomSvg>
              </SvgContainer>
              <ComparisonLabel>Program Type</ComparisonLabel>
            </ComparisonItem>
            <ComparisonItem
              isSelected={selectedItems['year-cost-b']}
              onClick={() => handleSelect('year-cost-b')}
              data-id="year-cost-b"
            >
              <ComparisonValue>
                {afterYearCost !== null ? formatCurrency(afterYearCost) : '-'}
              </ComparisonValue>
              <ComparisonLabel>25yr Cost</ComparisonLabel>
            </ComparisonItem>
          </ComparisonBox>
        </ComparisonColumn>
      </ComparisonGrid>
    </ComparisonContainer>
  );
});

export default EnergyProgramComparison;
