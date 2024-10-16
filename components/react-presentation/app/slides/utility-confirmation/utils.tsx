

// Utility functions

import { useDirectSalesforceAction } from "../../hooks/useSalesforceOperations";
import { IAnalysis, IConsumption } from "./state";

function useDirectSalesforceActions(recordId: string) {
  const { refetch: getSalesOpportunity } = useDirectSalesforceAction(
    'SalesOpportunityService.getSalesOpportunity',
    { salesOpportunityId: recordId }
  );

  const { refetch: createSiteGenability } = useDirectSalesforceAction(
    'GenabilityService.createSiteGenability',
    { pid: recordId }
  );

  const { refetch: setSalesOpportunity } = useDirectSalesforceAction(
    'SalesOpportunityService.setSalesOpportunity',
    { id: recordId, salesOpportunity: {} }
  );

  const { refetch: getSiteGenability } = useDirectSalesforceAction(
    'GenabilityService.getSiteGenability',
    { pid: recordId }
  );

  const { refetch: getProviderGenability } = useDirectSalesforceAction(
    'GenabilityService.getProviderGenability',
    {}
  );

  const { refetch: getTariffGenability } = useDirectSalesforceAction(
    'GenabilityService.getTariffGenability',
    { pid: recordId }
  );

  const { refetch: setTariffGenability } = useDirectSalesforceAction(
    'GenabilityService.setTariffGenability',
    { pid: recordId }
  );

  const { refetch: getConsumptionBySalesOpportunityId } = useDirectSalesforceAction(
    'ConsumptionService.getConsumptionBySalesOpportunityId',
    { salesOpportunityId: recordId }
  );

  const { refetch: createConsumption } = useDirectSalesforceAction(
    'ConsumptionService.createConsumption',
    {}
  );

  const { refetch: runAnalysisGenability } = useDirectSalesforceAction(
    'GenabilityService.runAnalysisGenability',
    {}
  );

  const { refetch: deleteAnalyses } = useDirectSalesforceAction(
    'AnalysisService.deleteAnalyses',
    {}
  );

  const { refetch: setConsumption } = useDirectSalesforceAction(
    'ConsumptionService.setConsumption',
    {}
  );

  const { refetch: getAnalyses } = useDirectSalesforceAction(
    'AnalysisService.getAnalyses',
    {}
  );

  return {
    getSalesOpportunity,
    createSiteGenability,
    setSalesOpportunity,
    getSiteGenability,
    getProviderGenability,
    getTariffGenability,
    setTariffGenability,
    getConsumptionBySalesOpportunityId,
    createConsumption,
    runAnalysisGenability,
    deleteAnalyses,
    setConsumption,
    getAnalyses,
  };
}

function prepareConsumptionForPush(consumption: IConsumption) {
  return {
    ...consumption,
    attributes: undefined,
    Sales_Opportunity__r: undefined,
    averageMonthlyUsage: undefined,
    averageMonthlyBill: undefined,
  };
}

function createChartData(analysis: IAnalysis[], currentYear: number) {
  return {
    labels: Array.from({ length: 25 }, (_, i) => (i + 1).toString()),
    datasets: [
      {
        label: 'Yearly Cost',
        data: analysis.map((analysisItem, index) => ({
          x: index + 1,
          y: analysisItem.Cost__c,
          rate: analysisItem.Rate__c,
          cost: analysisItem.Cost__c,
        })),
        borderColor: '#023B95',
        backgroundColor: createGradient,
        borderWidth: 4,
        pointRadius: (context: { dataIndex: number }) => (context.dataIndex === currentYear - 1 ? 10 : 0),
        pointBackgroundColor: (context: { dataIndex: number }) => (context.dataIndex === currentYear - 1 ? '#ffffff' : 'transparent'),
        pointBorderColor: (context: { dataIndex: number }) => (context.dataIndex === currentYear - 1 ? '#023B95' : 'transparent'),
        pointBorderWidth: 4,
        pointHitRadius: 10,
        fill: true,
        tension: 0.4,
      },
    ],
  };
}

function createGradient(context: any) {
  const chart = context.chart;
  const { ctx, chartArea } = chart;
  if (!chartArea) {
    return null;
  }
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(2, 59, 149, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
  return gradient;
}

function updateCostDisplay($state: any) {
  const firstYearCost = $state.analysis.get()[0].Cost__c;
  const currentYearCost = $state.analysis.get()[$state.currentYear.get() - 1].Cost__c;
  const costChange = ((currentYearCost - firstYearCost) / firstYearCost) * 100;

  if ($state.currentYear.get() === 25) {
    const totalCost = $state.analysis.get().reduce(
      (sum: number, data: IAnalysis) => sum + data.Cost__c,
      0
    );
    $state.costValue.set(
      `<span class="cost-label">Cost to do nothing</span>$${totalCost.toLocaleString()}`
    );
    $state.costChange.set('');
  } else {
    $state.costValue.set(
      `<span class="cost-label">Yearly Cost</span>$${currentYearCost.toLocaleString()}`
    );
    $state.costChange.set(
      (costChange >= 0 ? '↑ ' : '↓ ') +
        Math.abs(costChange).toFixed(1) +
        '%'
    );
  }
}

function calculateNewYear(currentYear: number, direction: number) {
  const possibleYears = [1, 10, 15, 25];
  const maxYears = 25;

  const currentIndex = possibleYears.indexOf(currentYear);

  if (currentIndex !== -1) {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < possibleYears.length) {
      return possibleYears[newIndex];
    } else {
      return currentYear;
    }
  } else {
    return possibleYears.reduce(
      (closestYear, year) => {
        if (
          direction === -1 &&
          year < currentYear &&
          year > closestYear
        ) {
          return year;
        } else if (
          direction === 1 &&
          year > currentYear &&
          year < closestYear
        ) {
          return year;
        }
        return closestYear;
      },
      direction === -1 ? 1 : maxYears
    );
  }
}

export const months = [
  { text: 'January', field: 'January_kWh__c' },
  { text: 'February', field: 'February_kWh__c' },
  { text: 'March', field: 'March_kWh__c' },
  { text: 'April', field: 'April_kWh__c' },
  { text: 'May', field: 'May_kWh__c' },
  { text: 'June', field: 'June_kWh__c' },
  { text: 'July', field: 'July_kWh__c' },
  { text: 'August', field: 'August_kWh__c' },
  { text: 'September', field: 'September_kWh__c' },
  { text: 'October', field: 'October_kWh__c' },
  { text: 'November', field: 'November_kWh__c' },
  { text: 'December', field: 'December_kWh__c' },
];