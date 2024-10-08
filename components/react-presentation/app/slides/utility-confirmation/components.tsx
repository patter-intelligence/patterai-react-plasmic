/* eslint-disable @typescript-eslint/ban-ts-comment */
import { observer } from '@legendapp/state/react';
import { $state } from './state';
import { useRunAnalysis } from '../../hooks/useSalesforceOperations';
import { showToast } from '../../utils/toast';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

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

const contextVariables = {
  LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
  COMPANY_NAME: 'Patter AI',
};

export function generateChart($state: any) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 20,
        top: 20,
        bottom: 20,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        } as any,
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 14,
            weight: '500',
            family: 'Montserrat',
          } as any,
          color: (context: { tick: { value: any } }) => {
            const value = Number(context.tick.value);
            return value === $state.currentYear.get() - 1
              ? '#023b95'
              : '#9b9b9b';
          },
        },
        title: {
          display: true,
          text: '(YEARS)',
          color: '#404040',
          font: {
            size: 14,
            weight: '500',
            family: 'Montserrat',
          } as any,
        },
        border: {
          display: false,
        },
      },
      y: {
        display: true,
        grid: {
          display: false,
          drawBorder: false,
        } as any,
        title: {
          display: true,
          text: 'YEARLY COST ($)',
          color: '#404040',
          font: {
            size: 14,
            weight: '500',
            family: 'Montserrat',
          } as any,
        },
        ticks: {
          callback: function (value: { toLocaleString: () => string }) {
            return '$' + value.toLocaleString();
          },
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'white',
        borderColor: '#d1d1d1',
        borderWidth: 1,
        titleColor: '#023b95',
        titleFont: {
          weight: 'bold',
        },
        bodyColor: '#404040',
        bodyFont: {
          weight: 'normal',
        },
        padding: 10,
        callbacks: {
          title: function (tooltipItems: { dataIndex: number }[]) {
            return 'Year ' + (tooltipItems[0].dataIndex + 1);
          },
          label: function (context: { dataIndex: any }) {
            const yearIndex = context.dataIndex;
            const rate =
              $state.chartData.get().datasets[0].data[yearIndex].rate;
            const cost =
              $state.chartData.get().datasets[0].data[yearIndex].cost;
            return [
              '$' + rate.toFixed(2) + '/kWh',
              '$' + cost.toLocaleString(),
            ];
          },
          labelTextColor: function (context: { dataIndex: number }) {
            return context.dataIndex === 0 ? '#9b9b9b' : '#404040';
          },
        },
        displayColors: false,
        bodyAlign: 'center',
        titleAlign: 'center',
      },
    },
    elements: {
      point: {
        radius: (context: { dataIndex: any }) => {
          const index = context.dataIndex;
          return index === $state.currentYear.get() - 1 ? 10 : 0;
        },
        backgroundColor: (context: { dataIndex: any }) => {
          const index = context.dataIndex;
          return index === $state.currentYear.get() - 1
            ? '#023b95'
            : 'transparent';
        },
        borderColor: (context: { dataIndex: any }) => {
          const index = context.dataIndex;
          return index === $state.currentYear.get() - 1
            ? '#ffffff'
            : 'transparent';
        },
        borderWidth: 3,
        hoverRadius: 10,
        hoverBorderWidth: 3,
      },
    },
    hover: {
      mode: 'nearest',
      intersect: false,
    },
    onClick: (event: any, elements: string | any[]) => {
      if (elements && elements.length) {
        const dataIndex = elements[0].index;
        $state.currentYear.set(dataIndex + 1);
      }
    },
  };
}

export const Step1 = observer(({ handleProvider, handleTariff }) => {
  const selectedUtilityProvider = $state.selectedUtilityProvider.get();
  const selectedUtilityTariff = $state.selectedUtilityTariff.get();
  const providers = $state.providers.get();
  const tariffs = $state.tariffs.get();
  const isTariffLoading = $state.isTariffLoading.get();

  console.log(
    'ucProfile::Step1 >> ',
    selectedUtilityProvider,
    selectedUtilityTariff
  );

  return (
    <div className="pup-selection-content">
      <p className="pup-selection-header">MAKE YOUR SELECTION</p>
      <h2 className="pup-selection-title">Your utility company & type</h2>
      <div className="pup-dropdown">
        <select
          name="Utility_Provider__c"
          value={selectedUtilityProvider}
          onChange={handleProvider}
        >
          <option value="">Select Utility Provider</option>
          {providers.map((provider) => (
            <option key={provider.value} value={provider.value}>
              {provider.label}
            </option>
          ))}
        </select>
      </div>
      <div className="pup-dropdown">
        <select
          name="Utility_Tariff__c"
          value={selectedUtilityTariff}
          onChange={handleTariff}
          disabled={isTariffLoading}
        >
          <option value="">Select Utility Tariff</option>
          {tariffs.map((tariff) => (
            <option key={tariff.value} value={tariff.value}>
              {tariff.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

export const Step2 = observer(({handleGeneric}) => {
  const consumption = $state.consumption.get();

  // const handleGeneric = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const field = e.target.name;
  //   let value = e.target.value.replace(/[^0-9]/g, '');
  //   const numValue = Number(value);
  //   $state.consumption[field].set(numValue);
  //   value = numValue.toLocaleString();
  //   e.target.value = value;
  // };

  return (
    <div className="pup-selection-content">
      <p className="pup-selection-header">INPUT INFORMATION</p>
      <h2 className="pup-selection-title">
        Add your monthly consumption information (kWh)
      </h2>
      <div className="pup-input-grid">
        {months.map((month) => (
          <div className="pup-input-group" key={month.field}>
            <label className="pup-input-label" htmlFor={month.field}>
              {month.text}
            </label>
            <input
              type="text"
              id={month.field}
              className="pup-input-field validate"
              name={month.field}
              placeholder="Enter kWh"
              value={
                // @ts-ignore
                $state.consumption.get()?.[month.field]?.toLocaleString() || ''
              }
              onChange={handleGeneric}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export const Step3 = observer(() => {
  const consumption = $state.consumption.get();
  const providers = $state.providers.get();
  const tariffs = $state.tariffs.get();
  const selectedUtilityProvider = $state.selectedUtilityProvider.get();
  const selectedUtilityTariff = $state.selectedUtilityTariff.get();

  const selectedProvider = providers.find(
    (p) => p.value === Number(selectedUtilityProvider)
  );
  const selectedTariffObj = tariffs.find(
    (t) => t.value === Number(selectedUtilityTariff)
  );

  const averageMonthlyUsage = consumption?.averageMonthlyUsage || 0;
  const averageMonthlyBill = consumption?.averageMonthlyBill || 0;
  const averageDailySpend = averageMonthlyBill / 30;

  return (
    <div className="pup-selection-content">
      <div className="pup-review-content">
        <div className="pup-information-section">
          <h2 className="h2-semi">Your Information</h2>
          <div className="timeline">
            <div className="info-item">
              <p className="info-label">UTILITY COMPANY</p>
              <p className="info-value">
                {selectedProvider ? selectedProvider.label : 'Not selected'}
              </p>
            </div>
            <div className="pup-info-item">
              <p className="pup-info-label">UTILITY TARIFF</p>
              <p className="pup-info-value">
                {selectedTariffObj ? selectedTariffObj.label : 'Not selected'}
              </p>
            </div>
            <div className="pup-pup-info-item">
              <p className="pup-info-label">AVERAGE MONTHLY USAGE</p>
              <p className="pup-pup-info-value">
                {averageMonthlyUsage.toLocaleString()} kWh
              </p>
            </div>
          </div>
        </div>
        <div className="pup-summary-section">
          <div className="pup-info-item-no-dot">
            <p className="d1-semi gray">Your Average Daily Spend</p>
            <p className="pup-dollar-amount">${averageDailySpend.toFixed(2)}</p>
          </div>
          <div className="pup-info-item-no-dot">
            <p className="d1-semi gray">Your Average Monthly Bill</p>
            <p className="pup-dollar-amount">
              ${averageMonthlyBill.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

import { Settings as SettingsIcon } from '@material-ui/icons';
import { appState } from '../../state/appState';

export const Step4 = observer(() => {
  const analysis = $state.analysis.get();
  const currentYear = $state.currentYear.get();
  const chartData = $state.chartData.get();
  const costValue = $state.costValue.get();
  const costChange = $state.costChange.get();

  const setStep = (step: number) => appState.currentStepIndex.set(step);

  const chartOptions: ChartOptions<'line'> = generateChart($state) as any;

  return (
    <div className="pup-selection-content">
      <div className="gear-icon" onClick={() => setStep(2)}>
        <SettingsIcon />
      </div>
      <div className="pup-energy-chart-container">
        <div className="pup-yearly-cost">
          <span
            className="pup-cost-value"
            style={{ display: 'flex', flexDirection: 'column' }}
            dangerouslySetInnerHTML={{ __html: costValue }}
          />
          <span
            className="pup-cost-change"
            style={{ color: costChange.includes('↑') ? '#28a745' : '#dc3545' }}
          >
            {costChange}
          </span>
        </div>
        <Line
          data={chartData as any}
          options={chartOptions}
          className="pup-energy-chart"
        />
      </div>
    </div>
  );
});




export const LoadingSpinner = observer(() => {
  const isLoading = $state.isLoading.get();
  const loaderTitle = $state.loaderTitle.get() || "Patter AI";
  return (
    <div className={`up-loader-wrapper ${isLoading ? 'visible' : 'hidden'}`}>
      <div className="up-loader-container">
        <img src={contextVariables.LOADER_LOGO} alt="Patter Logo" />
        <div className="up-company-name">{loaderTitle || contextVariables.COMPANY_NAME}</div>
        <div className="up-loading-bar">
          <div className="up-loading-progress"></div>
        </div>
      </div>
    </div>
  );
});
