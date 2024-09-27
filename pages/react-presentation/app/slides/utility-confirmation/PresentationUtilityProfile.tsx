/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';

import './PresentationUtilityProfile.module.css';
import { appState } from '../../state/appState';
import { useDirectSalesforceAction } from '../../hooks/useSalesforceOperations';
import { observer } from '@legendapp/state/react';
import { observable } from '@legendapp/state';
import { $state } from './state';
import {
  generateChart,
  LoadingSpinner,
  Step1,
  Step2,
  Step3,
  Step4,
} from './components';
import { pid } from 'process';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  recordId: string;
}

const months = [
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

const PresentationUtilityProfile: React.FC<Props> = observer(() => {
  const chartRef = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState<number>(0);
  const [chartHeight, setChartHeight] = useState<number>(0);

  const recordId = appState.recordId.get();

  const { refetch: getSalesOpportunity } = useDirectSalesforceAction(
    'SalesOpportunityService.getSalesOpportunity',
    { salesOpportunityId: recordId }
  );

  const { refetch: createSiteGenability } = useDirectSalesforceAction(
    'GenabilityService.createSiteGenability',
    { pid: recordId }
  );

  const { refetch: createProfile } = useDirectSalesforceAction(
    'GenabilityService.createProfileGenability',
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

  const { refetch: getConsumptionBySalesOpportunityId } =
    useDirectSalesforceAction(
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

  const yearDisplay = `Year ${$state.currentYear.get()}`;

  useEffect(() => {
    const fetchInitialData = async () => {
      $state.isLoading.set(true);
      try {
        const salesOpportunity = await getSalesOpportunity();
        if (!salesOpportunity.Genability_Site__c) {
          await createSiteGenability();
          await setSalesOpportunity({
            salesOpportunity: { ...salesOpportunity, Genability_Site__c: true },
          });
        }
        await getProvider();
        const consumptionData = await getOrCreateConsumption();

        $state.consumption.set(consumptionData);

        await initializeSelectedValues(consumptionData);

        if (consumptionData.Sales_Opportunity__r.Analysis_Fetched__c) {
          const analysisData = await loadAnalysis(consumptionData.Id);
          const { averageMonthlyUsage, averageMonthlyBill } =
            calculateAverageUsage(consumptionData, analysisData);
          $state.consumption.set({
            ...$state.consumption.get(),
            averageMonthlyUsage,
            averageMonthlyBill,
          } as any);
        } else {
          const { averageMonthlyUsage } = calculateAverageUsage(
            consumptionData,
            []
          );
          $state.consumption.set({
            ...$state.consumption.get(),
            averageMonthlyUsage,
            averageMonthlyBill: 0,
          } as any);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        $state.isLoading.set(false);
      }
    };

    fetchInitialData();
  }, [recordId]);

  useEffect(() => {
    if (
      $state.selectedUtilityProvider.get() &&
      (!$state.tariffs.get() || $state.tariffs.get().length === 0)
    ) {
      getTariff();
    }
  }, [$state.selectedUtilityProvider.get()]);

  const getProvider = async () => {
    try {
      const siteGenability = await getSiteGenability({
        pid: recordId,
      });

      const providerData = await getProviderGenability({
        zip: siteGenability.results[0].address.zip,
        country: siteGenability.results[0].address.country,
      });

      $state.providers.set(
        providerData.results.map((r: any) => ({
          label: r.name,
          value: r.lseId,
          selected: r.lseId === Number($state.selectedUtilityProvider.get()),
        }))
      );
    } catch (error) {
      console.error('Error getting provider:', error);
    }
  };

  const getTariff = async () => {
    $state.isTariffLoading.set(true);
    try {
      const tariffData = await getTariffGenability({ pid: recordId });
      $state.tariffs.set(
        tariffData.results.map((r: any) => ({
          label: r.tariffName,
          value: r.masterTariffId,
          selected:
            r.masterTariffId === Number($state.selectedUtilityTariff.get()),
        }))
      );
    } catch (error) {
      console.error('Error getting tariff:', error);
    } finally {
      $state.isTariffLoading.set(false);
    }
  };

  const getOrCreateConsumption = async () => {
    try {
      let consumptionData = await getConsumptionBySalesOpportunityId({
        salesOpportunityId: recordId,
      });
      if (!consumptionData) {
        const newConsumption = { Sales_Opportunity__c: recordId };
        await createConsumption({
          consumption: newConsumption,
          salesOpportunityId: recordId,
        });
        consumptionData = await getConsumptionBySalesOpportunityId({
          salesOpportunityId: recordId,
        });
      }
      return consumptionData;
    } catch (error) {
      console.error('Error getting or creating consumption:', error);
    }
  };

  const initializeSelectedValues = async (consumptionData: any) => {
    if (consumptionData) {
      $state.selectedUtilityProvider.set(consumptionData.lseId__c || '');
      $state.selectedUtilityTariff.set(consumptionData.masterTariffId__c || '');

      console.log(
        'setSelectedUtilityProvider',
        $state.selectedUtilityProvider.get(),
        consumptionData.lseId__c
      );
      console.log(
        'setSelectedUtilityTariff',
        $state.selectedUtilityTariff.get(),
        consumptionData.masterTariffId__c
      );

      if (
        $state.selectedUtilityProvider.get() &&
        (!$state.tariffs.get() || $state.tariffs.get().length === 0)
      ) {
        await getTariff();
      }
    }
  };

  const handleProvider = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const selectedProvider = $state.providers
      .get()
      .find((p) => p.value === Number(selectedValue));
    if (selectedProvider) {
      $state.isTariffLoading.set(true);
      $state.consumption.set({
        ...$state.consumption.get(),
        Utility_Provider__c: selectedProvider.label,
        lseId__c: selectedProvider.value,
      } as any);
      $state.selectedUtilityProvider.set(selectedValue);
      $state.selectedUtilityTariff.set('');
      try {
        await getProviderGenability({
          pid: recordId,
          keyName: 'lseId',
          dataValue: selectedProvider?.value?.toString(),
        });
        const newConsumption = {
          ...$state.consumption.get(),
          Utility_Provider__c: selectedProvider.label,
          lseId__c: selectedProvider.value,
        };

        $state.consumption.set(newConsumption as any);
        await updateConsumption();

        // Clear existing tariffs and fetch new ones
        $state.tariffs.set([]);
        await getTariff();
      } catch (error) {
        console.error('Error updating provider:', error);
      } finally {
        $state.isTariffLoading.set(false);
      }
    }
  };

  const handleTariff = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('handleTariff', e.target.value);
    const selectedValue = e.target.value;
    const selectedTariff = $state.tariffs
      .get()
      .find((t: { value: number }) => t.value === Number(selectedValue));
    if (selectedTariff) {
      const updatedConsumption = {
        ...$state.consumption.get(),
        Utility_Tariff__c: selectedTariff.label,
        masterTariffId__c: selectedTariff.value,
      };

      $state.consumption.set(updatedConsumption as any);
      $state.selectedUtilityTariff.set(selectedValue);

      try {
        await setTariffGenability({
          pid: recordId,
          keyName: 'masterTariffId',
          dataValue: selectedTariff.value.toString(),
        });

        await updateConsumption();
      } catch (error) {
        console.error('Error updating tariff:', error);
      }
    }
  };

  const handleGeneric = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name;
    let value = e.target.value;
    let formattedValue = value;

    if (value !== '') {
      value = value.replace(/[^0-9]/g, '');
      formattedValue = Number(value).toLocaleString();
    }

    e.target.value = formattedValue;

    if ($state.consumption.get()) {
      const updatedConsumption = {
        ...$state.consumption.get(),
        [field]: value === '' ? null : Number(value),
      };
      $state.consumption.set(updatedConsumption as any);

      try {
        await updateConsumption();
      } catch (error) {
        console.error('Error updating consumption:', error);
      }
    }
  };

  const calculateAverageUsage = (consumptionData: any, analysisData: any[]) => {
    if (!consumptionData)
      return { averageMonthlyUsage: 0, averageMonthlyBill: 0 };

    console.log('calculateAverageUsage', {
      consumptionData,
      analysisData,
    });

    const monthFields = months.map((month) => month.field);
    let totalUsage = 0;
    let filledMonths = 0;

    monthFields.forEach((field) => {
      if (consumptionData[field]) {
        const usage = Number(consumptionData[field]);
        totalUsage += usage;
        filledMonths++;
      }
    });

    const averageUsage =
      filledMonths > 0 ? Math.round(totalUsage / filledMonths) : 0;

    // debugger;

    const averageMonthlyBill = Math.round(
      averageUsage * analysisData[0].Rate__c || 0
    );
    // analysisData && analysisData.length > 0
    //   ? Math.round(analysisData[0].Cost__c / 12)
    //   : 0;

    return {
      averageMonthlyUsage: averageUsage,
      averageMonthlyBill: averageMonthlyBill,
    };
  };

  useEffect(() => {
    if ($state.consumption.get()) {
      const { averageMonthlyUsage, averageMonthlyBill } = calculateAverageUsage(
        $state.consumption.get(),
        $state.analysis.get()
      );

      $state.consumption.set({
        ...$state.consumption.get(),
        averageMonthlyUsage,
        averageMonthlyBill,
      } as any);
    }
  }, [$state.analysis.get()]);

  const validateInput = () => {
    const consumption = $state.consumption.get();
    if (!consumption) return false;
    if (!consumption.Utility_Provider__c || !consumption.Utility_Tariff__c)
      return false;
    // Add more validation as needed
    return true;
  };

  const haveDifferentConsumptionValues = (
    oldConsumption: any,
    newConsumption: any
  ) => {
    const monthFields = months.map((month) => month.field);
    return (
      monthFields.some(
        (field) => oldConsumption[field] !== newConsumption[field]
      ) ||
      oldConsumption.Utility_Provider__c !==
        newConsumption.Utility_Provider__c ||
      oldConsumption.Utility_Tariff__c !== newConsumption.Utility_Tariff__c
    );
  };

  const hasAllMonthlyValues = (consumption: any) => {
    const monthFields = months.map((month) => month.field);
    return monthFields.every(
      (field) => consumption[field] !== null && consumption[field] !== undefined
    );
  };

  const updateConsumption = async (withAnalyses = false) => {
    const consumption = $state.consumption.get();
    if (!consumption) throw new Error('No consumption data');
    const consumptionForPush = {
      ...consumption,
      attributes: undefined,
      Sales_Opportunity__r: undefined,
      averageMonthlyUsage: undefined,
      averageMonthlyBill: undefined,
      Analyses__r: undefined,
    };
    if (withAnalyses) {
      // Add analyses to the consumption object
      // @ts-ignore
      consumptionForPush.Analyses__r = consumption.Analyses__r;
    }
    await setConsumption({ consumption: consumptionForPush });
  };

  const runAnalysis = async () => {
    let analysisData;
    try {
      analysisData = await runAnalysisGenability({
        pid: recordId,
        masterTariffId: $state.consumption.get()?.masterTariffId__c,
        sids: null,
      });

      if (analysisData.status === 'error') {
        throw new Error(analysisData.message);
      }
    } catch (e) {
      // console.error('Error running analysis:', e);
      // let's create a new profile and run the analysis again
      await createProfile({ pid: recordId });
      analysisData = await runAnalysisGenability({
        pid: recordId,
        masterTariffId: $state.consumption.get()?.masterTariffId__c,
        sids: null,
      });
      return;
    }

    processAnalysisData(analysisData.results[0]);
  };

  const processAnalysisData = (analysisResult: any) => {
    let baselineSeriesId: string | null = null;
    const analysis_data = new Map();

    // Process series information
    for (const series of analysisResult.series) {
      if (series.displayLabel === 'Before Solar Utility (Mo/Year 1)') {
        baselineSeriesId = series.seriesId;
      }
      if (
        [
          'Before Solar Utility (Mo/Year 1)',
          'After Solar Utility (Mo/Year 1)',
          'Before Solar Utility (Annual)',
          'After Solar Utility (Annual/Lifetime)',
        ].includes(series.displayLabel)
      ) {
        analysis_data.set(series.seriesId, {
          label: series.displayLabel,
          period: series.seriesPeriod,
        });
      }
    }

    const updatedConsumption = {
      ...$state.consumption.get(),
      Net_Avoided_kWh__c: analysisResult.summary.netAvoidedKWh,
      Post_Total_kWh__c: analysisResult.summary.postTotalKWh,
      Analyses__r: [] as any,
    };

    console.log({ 'analysisResult.summary': analysisResult.summary });

    // Process series data
    for (const seriesData of analysisResult.seriesData) {
      if (analysis_data.has(seriesData.seriesId)) {
        updatedConsumption.Analyses__r.push({
          Consumption__c: updatedConsumption.Id,
          Display_Label__c: analysis_data.get(seriesData.seriesId).label,
          Series_Id__c: seriesData.seriesId,
          Series_Period__c: analysis_data.get(seriesData.seriesId).period,
          From_Date_Time__c: seriesData.fromDateTime,
          To_Date_Time__c: seriesData.toDateTime,
          Cost__c: seriesData.cost,
          Quantity__c: seriesData.qty,
          Rate__c: seriesData.rate,
        });
      }

      // Baseline for missing monthly data
      if (seriesData.seriesId === baselineSeriesId) {
        const monthField = months.find(
          (month) =>
            month.text ===
            new Date(seriesData.fromDateTime).toLocaleString('default', {
              month: 'long',
            })
        )?.field;
        if (monthField && (updatedConsumption as any)[monthField] == null) {
          (updatedConsumption as any)[monthField] = Math.round(seriesData.qty);
        }
      }
    }

    $state.consumption.set(updatedConsumption as any);
  };

  const updateSalesOpportunity = async () => {
    // Implement SalesOpportunity update logic here
    // This might involve calling a Salesforce API
  };

  const clearAnalyses = async () => {
    await deleteAnalyses({
      consumptionId: $state.consumption.get()?.Id,
    });
  };

  const updateProfile = async () => {
    const consumptionId = ($state.consumption.get() as any).Id;
    const loadedAnalysisData = await loadAnalysis(consumptionId);
    updateAverageUsages(calculateAverageUsage, loadedAnalysisData);
  };

  const loadAnalysis = async (id: string) => {
    try {
      const analysesData = await getAnalyses({
        consumptionId: id,
        seriesId: '5',
      });
      $state.analysis.set(analysesData);
      return analysesData;
    } catch (error) {
      console.error('Error loading analysis:', error);
      return [];
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth);
        setChartHeight(chartContainerRef.current.offsetHeight);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if ($state.analysis.get().length > 0) {
      const newChartData = {
        labels: Array.from({ length: 25 }, (_, i) => (i + 1).toString()),
        datasets: [
          {
            label: 'Yearly Cost',
            data: $state.analysis.get().map((analysisItem, index) => ({
              x: index + 1,
              y: analysisItem.Cost__c,
              rate: analysisItem.Rate__c,
              cost: analysisItem.Cost__c,
            })),
            borderColor: '#023b95',
            backgroundColor: (context: any) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) {
                return null;
              }
              const gradient = ctx.createLinearGradient(
                0,
                chartArea.top,
                0,
                chartArea.bottom
              );
              gradient.addColorStop(0, 'rgba(2, 59, 149, 0.5)');
              gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
              return gradient;
            },
            borderWidth: 4,
            pointRadius: (context: { dataIndex: any }) => {
              const index = context.dataIndex;
              return index === $state.currentYear.get() - 1 ? 10 : 0;
            },
            pointBackgroundColor: (context: { dataIndex: any }) => {
              const index = context.dataIndex;
              return index === $state.currentYear.get() - 1
                ? '#ffffff'
                : 'transparent';
            },
            pointBorderColor: (context: { dataIndex: any }) => {
              const index = context.dataIndex;
              return index === $state.currentYear.get() - 1
                ? '#023b95'
                : 'transparent';
            },
            pointBorderWidth: 4,
            pointHitRadius: 10,
            fill: true,
            tension: 0.4,
          },
        ],
      };
      $state.chartData.set(newChartData);
    }
  }, [$state.analysis.get(), $state.currentYear.get(), chartWidth, chartHeight]);

  useEffect(() => {
    if ($state.analysis.get().length > 0) {
      const firstYearCost = $state.analysis.get()[0].Cost__c;
      const currentYearCost =
        $state.analysis.get()[$state.currentYear.get() - 1].Cost__c;
      const costChange =
        ((currentYearCost - firstYearCost) / firstYearCost) * 100;

      if ($state.currentYear.get() === 25) {
        const totalCost = $state.analysis
          .get()
          .reduce((sum, data) => sum + data.Cost__c, 0);
        $state.costValue.set(
          `<span class="pup-cost-label">Cost to do nothing</span>$${totalCost.toLocaleString()}`
        );
        $state.costChange.set('');
      } else {
        $state.costValue.set(
          `<span class="pup-cost-label">Yearly Cost</span>$${currentYearCost.toLocaleString()}`
        );
        $state.costChange.set(
          (costChange >= 0 ? '↑ ' : '↓ ') +
            Math.abs(costChange).toFixed(1) +
            '%'
        );
      }
    }
  }, [$state.analysis.get(), $state.currentYear.get()]);

  const handleNextClick = async () => {
    $state.isLoading.set(true);
    if ($state.step.get() === 2) {
      try {
        // 1. Validate input
        if (!validateInput()) {
          throw new Error('Invalid input. Please check all fields.');
        }

        const oldConsumption = await getConsumptionBySalesOpportunityId({
          salesOpportunityId: recordId,
        });
        const newConsumption = $state.consumption.get();

        const valuesChanged = haveDifferentConsumptionValues(
          oldConsumption,
          newConsumption
        );
        const missingMonthlyValues = !hasAllMonthlyValues(newConsumption);

        if (valuesChanged || missingMonthlyValues) {
          $state.loaderTitle.set('Running analysis');
          // 2. Update consumption
          await updateConsumption(false);

          // 3. Create a profile
          await createProfile({
            pid: recordId,
          });

          $state.loaderTitle.set('Updating Profile');
          // 4. Run analysis
          await runAnalysis();

          // 5. Update SalesOpportunity
          await updateSalesOpportunity();

          // 6. Clear analyses
          await clearAnalyses();

          $state.loaderTitle.set('Updating consumption');
          // 7. Update the consumption in Salesforce
          await updateConsumption(true);

          // 8. Update the profile
          await updateProfile();

          // 9. If there were missing monthly values, update the state to show values again
          if (missingMonthlyValues) {
            const updatedConsumption = await getConsumptionBySalesOpportunityId(
              {
                salesOpportunityId: recordId,
              }
            );
            $state.consumption.set(updatedConsumption);
            $state.step.set(2); // Go back to step 2 to show the updated values
          } else {
            // Move to the next step
            $state.step.set(3);
          }
        } else {
          // 4. Run analysis
          await runAnalysis();

          // 8. Update the profile
          await updateProfile();
          console.log(
            'No changes in consumption values and all monthly values present. Moving to next step.'
          );
          $state.step.set(3);
        }
      } catch (error) {
        console.error('Error during next step:', error);
        // Handle the error (e.g., show an error message to the user)
      }
    } else {
      $state.step.set(Math.min($state.step.get() + 1, 4));
    }
    $state.isLoading.set(false);
  };

  const handleBackClick = () => {
    $state.step.set(Math.max($state.step.get() - 1, 1));
  };

  const handleYearChange = (direction: number) => {
    const possibleYears = [1, 10, 15, 25];
    const maxYears = 25;

    let newYear: number;

    const currentIndex = possibleYears.indexOf($state.currentYear.get());

    if (currentIndex !== -1) {
      const newIndex = currentIndex + direction;
      if (newIndex >= 0 && newIndex < possibleYears.length) {
        newYear = possibleYears[newIndex];
      } else {
        newYear = $state.currentYear.get();
      }
    } else {
      newYear = possibleYears.reduce(
        (closestYear, year) => {
          if (
            direction === -1 &&
            year < $state.currentYear.get() &&
            year > closestYear
          ) {
            return year;
          } else if (
            direction === 1 &&
            year > $state.currentYear.get() &&
            year < closestYear
          ) {
            return year;
          }
          return closestYear;
        },
        direction === -1 ? 1 : maxYears
      );
    }

    if (newYear >= 1 && newYear <= maxYears) {
      $state.currentYear.set(newYear);
    }
  };

  generateChart($state);

  return (
    <div className="pup-presentation-utility-profile">
      <div className="pup-container">
        <h1 className="pup-h1-semi pup-fade-in pup-heading">Utility Profile</h1>
        <div className="pup-card-utility pup-fade-in">
          {$state.step.get() < 4 && $state.step.get() !== 1 && (
            <button className="pup-back-button d1-semi" onClick={handleBackClick}>
              BACK
            </button>
          )}
          <div className="pup-content-wrapper">
            <LoadingSpinner />

            {!$state.isLoading.get() && $state.step.get() === 1 && (
              <Step1
                handleProvider={handleProvider}
                handleTariff={handleTariff}
              />
            )}

            {$state.step.get() === 2 && <Step2 handleGeneric={handleGeneric} />}

            {$state.step.get() === 3 && <Step3 />}

            {$state.step.get() === 4 && (
              <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }}>
                <Step4 width={chartWidth} height={chartHeight} />
              </div>
            )}

            {$state.step.get() < 4 && (
              <div className="pup-bottom-container">
                <div className="pup-stepper">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`pup-stepper-dot ${
                        s === $state.step.get() ? 'active' : ''
                      }`}
                    ></div>
                  ))}
                </div>
                <button className="pup-verify-button" onClick={handleNextClick}>
                  {$state.step.get() === 3 ? 'Analyze' : 'Next'}
                </button>
              </div>
            )}
          </div>
        </div>

        {$state.step.get() === 4 && (
          <div
            className={`pup-chart-navigation ${
              $state.step.get() === 4 ? 'visible' : 'hidden'
            }`}
          >
            <button
              className="pup-nav-button prev"
              disabled={$state.currentYear.get() <= 1}
              onClick={() => handleYearChange(-1)}
            >
              &lt;
            </button>
            <span className="pup-year-display">{yearDisplay}</span>
            <button
              className="pup-nav-button next"
              disabled={$state.currentYear.get() >= 25}
              onClick={() => handleYearChange(1)}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default PresentationUtilityProfile;

function updateAverageUsages(
  calculateAverageUsage: (
    consumptionData: any,
    analysisData: any[]
  ) => { averageMonthlyUsage: number; averageMonthlyBill: number },
  loadedAnalysisData: any
) {
  const { averageMonthlyUsage, averageMonthlyBill } = calculateAverageUsage(
    $state.consumption.get(),
    loadedAnalysisData
  );
  const finalConsumption = {
    ...$state.consumption.get(),
    averageMonthlyUsage,
    averageMonthlyBill,
  };
  $state.consumption.set(finalConsumption as any);
}
