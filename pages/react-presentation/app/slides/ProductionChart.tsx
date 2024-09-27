/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty-pattern */
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  Suspense,
  useLayoutEffect,
} from 'react';
import { Chart, ChartConfiguration, TooltipModel } from 'chart.js/auto';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import './ProductionChart.module.css';
import { observer } from '@legendapp/state/react';
import Loader from '../components/Loader';
import CircularChart from './CircularChart';
import {
  ChartData,
  calculateSolarOffset,
  calculateAdjustedOffset,
  adjustConsumption,
  getConsumptionColors,
  getTrend,
} from '../utils/ProductionEngine';

const getOrCreateTooltip = (chart: Chart) => {
  let tooltipEl = chart.canvas.parentNode?.querySelector(
    'div.custom-tooltip'
  ) as HTMLDivElement;

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'custom-tooltip';
    tooltipEl.style.background = 'rgba(255, 255, 255, 0.95)';
    tooltipEl.style.borderRadius = '5px';
    tooltipEl.style.color = '#333';
    tooltipEl.style.opacity = '0';
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.transform = 'translate(-50%, 0)';
    tooltipEl.style.transition = 'all .2s ease';
    tooltipEl.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    tooltipEl.style.padding = '10px 14px';
    tooltipEl.style.fontSize = '14px';
    tooltipEl.style.lineHeight = '1.4';
    tooltipEl.style.minWidth = '200px';

    chart.canvas.parentNode?.appendChild(tooltipEl);
  }

  return tooltipEl;
};

const externalTooltipHandler = (context: {
  chart: Chart;
  tooltip: TooltipModel<'bar' | 'line'>;
}) => {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltip(chart);

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  if (tooltip.body) {
    const titleLines = tooltip.title || [];
    const bodyLines = tooltip.body.map((b) => b.lines);

    const productionValue = bodyLines[0]
      ? bodyLines[0][0].split(':')[1].trim()
      : 'N/A';
    const consumptionValue = bodyLines[0]
      ? bodyLines[0][1].split(':')[1].trim()
      : 'N/A';

    const innerHtml = `
      <div style="font-family: Arial, sans-serif; border-radius: 8px; ">
        <div style="font-weight: 600; font-size: 14px; color: #333333;">
          ${titleLines[0]} 
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="text-align: center;">
            <div style="font-size: 14px; color: black; margin-bottom: 4px;">Production</div>
            <div style="font-size: 14px; font-weight: 600; color: #173A90;">${productionValue}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 14px; color: black; margin-bottom: 4px;">Consumption</div>
            <div style="font-size: 14px; font-weight: 600; color: #666666;">${consumptionValue}</div>
          </div>
        </div>
      </div>
    `;

    tooltipEl.innerHTML = innerHtml;
  }

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = positionX + tooltip.caretX + 'px';
  tooltipEl.style.top = positionY + tooltip.caretY + 'px';
  tooltipEl.style.transform = 'translate(-50%, calc(-100% - 10px))';
};

const LoadingSpinner: React.FC<{ isLoading: boolean; message: string }> = ({
  isLoading,
  message,
}) => (
  <div className={`up-loader-wrapper ${isLoading ? 'visible' : 'hidden'}`}>
    <div className="up-loader-container">
      <div className="up-loader-spinner"></div>
      <div className="up-company-name">{message}</div>
    </div>
  </div>
);

const SkeletonLoader: React.FC = () => (
  <div className="skeleton-loader">
    <div className="skeleton-header"></div>
    <div className="skeleton-chart"></div>
    <div className="skeleton-legend"></div>
  </div>
);

const LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'June',
  'July',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

const SolarPowerChart: React.FC = observer(() => {
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [consumption, setConsumption] = useState<number[]>([]);
  const [production, setProduction] = useState<number[]>([]);
  const [isChartReady, setIsChartReady] = useState(false);
  const [solarOffset, setSolarOffset] = useState(0);
  const [efficiencyOffset, setEfficiencyOffset] = useState(0);
  const [showEfficiency, setShowEfficiency] = useState(false);
  const [adjustedOffset, setAdjustedOffset] = useState(0);
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const recordId = appState.recordId.get();

  const handleEfficiencyToggle = () => {
    setShowEfficiency((prev) => !prev);
    const newAdjustedOffset = showEfficiency
      ? solarOffset
      : calculateAdjustedOffset(production, consumption, efficiencyOffset);
    setAdjustedOffset(newAdjustedOffset);
    updateChartData();
  };

  const updateChartData = useCallback(() => {
    if (chartRef.current) {
      const adjustedConsumption = showEfficiency
        ? adjustConsumption(consumption, efficiencyOffset)
        : consumption;

      const consumptionColors = getConsumptionColors(
        adjustedConsumption,
        production
      );

      chartRef.current.data.datasets[0].data = adjustedConsumption;
      chartRef.current.data.datasets[0].backgroundColor = consumptionColors;
      chartRef.current.update('none');
    }
  }, [consumption, production, showEfficiency, efficiencyOffset]);

  const { refetch: fetchChartData } = useDirectSalesforceAction(
    'ProductionService.getPresentationChartData',
    { salesOpportunityId: recordId },
    false
  );

  const createChart = useCallback(() => {
    if (
      !canvasRef.current ||
      consumption.length === 0 ||
      production.length === 0
    )
      return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(76, 124, 247, 0.4)');
    gradient.addColorStop(0.5, 'rgba(76, 124, 247, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');

    const adjustedConsumption = showEfficiency
      ? adjustConsumption(consumption, efficiencyOffset)
      : consumption;

    const consumptionColors = getConsumptionColors(
      adjustedConsumption,
      production
    );

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: LABELS,
        datasets: [
          {
            type: 'bar',
            label: 'Consumption',
            data: adjustedConsumption,
            backgroundColor: consumptionColors,
            borderRadius: 6,
            order: 2,
          },
          {
            type: 'line',
            label: 'Production',
            data: production,
            borderColor: 'rgba(23, 58, 144, 1)',
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: 'rgba(23, 58, 144, 1)',
            pointHoverRadius: 8,
            hitRadius: 15,
            order: 1,
          } as any,
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'kWh',
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 5,
            },
          },
          tooltip: {
            enabled: false,
            position: 'nearest',
            external: externalTooltipHandler,
            callbacks: {
              title: function (tooltipItems) {
                return LABELS[tooltipItems[0].dataIndex];
              },
              label: function (context) {
                const productionValue =
                  production[context.dataIndex].toFixed(2);
                const consumptionValue =
                  adjustedConsumption[context.dataIndex].toFixed(2);
                return [
                  `Production: ${productionValue} kWh`,
                  `Consumption: ${consumptionValue} kWh`,
                ];
              },
            },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#333',
            titleFont: {
              weight: 'bold',
            },
            bodyColor: '#666',
            bodyFont: {
              weight: 'normal',
            },
            borderColor: 'rgba(0,0,0,0.1)',
            borderWidth: 1,
          },
        },
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 0,
            bottom: 0,
          },
        },
      },
    };

    chartRef.current = new Chart(ctx, config);
  }, [consumption, production, showEfficiency, efficiencyOffset]);

  const handleResize = useCallback(() => {
    if (containerRef.current && canvasRef.current && chartRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      canvasRef.current.width = containerWidth;
      canvasRef.current.height = containerHeight;
      chartRef.current.resize();
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        appState.isLoading.set(true);
        const chartData = (await fetchChartData()) as any;

        console.log('Production Chart Data: ', chartData);


        if (chartData) {
          if (chartData.Analysis_Fetched__c) {
            const consumptionData = chartData.consumption.map(Number);
            const productionData = chartData.production.map(Number);

            if (consumptionData.some(isNaN) || productionData.some(isNaN)) {
              throw new Error('Invalid data received');
            }

            setConsumption(consumptionData);
            setProduction(productionData);

            const calculatedSolarOffset = calculateSolarOffset(
              productionData,
              consumptionData
            );
            setSolarOffset(calculatedSolarOffset);

            const efficiencyOffsetValue =
              chartData.totalEnergyEfficiencyOffset || 0;
            setEfficiencyOffset(efficiencyOffsetValue);

            const adjustedOffsetValue = calculateAdjustedOffset(
              productionData,
              consumptionData,
              efficiencyOffsetValue
            );
            setAdjustedOffset(
              showEfficiency ? adjustedOffsetValue : calculatedSolarOffset
            );

            setIsChartReady(true);
          } else {
            setMessage(
              'Please visit the Energy Consumption tab to complete the analysis and ensure to tap the Run button.'
            );
            setShowMessage(true);
          }
        } else {
          throw new Error('No data received');
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setMessage('Error loading data. Please try again later.');
        setShowMessage(true);
      } finally {
        appState.isLoading.set(false);
      }
    };

    fetchData();
  }, [recordId]);

 
  useLayoutEffect(() => {
    if (isChartReady && consumption.length > 0 && production.length > 0) {
      if (chartRef.current) {
        updateChartData();
      } else {
        createChart();
      }
      handleResize();
    }
  }, [isChartReady, consumption, production, showEfficiency, efficiencyOffset, createChart, updateChartData, handleResize]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [handleResize]);

  return (
    <div className="production-chart">
      <Suspense
        fallback={
          <LoadingSpinner
            isLoading={true}
            message="Loading solar power data..."
          />
        }
      >
        <div className="chart-container-pc" ref={containerRef}>
          <div className="chart-header">
            <h1 className="h1-semi fade-in heading">Your Solar Power</h1>
            <CircularChart
              size={90}
              solarPercentage={solarOffset}
              efficiencyPercentage={showEfficiency ? efficiencyOffset : 0}
              utilityPercentage={
                100 - solarOffset - (showEfficiency ? efficiencyOffset : 0)
              }
              solarKWh={production.reduce((sum, value) => sum + value, 0)}
              utilityKWh={
                consumption.reduce((sum, value) => sum + value, 0) -
                production.reduce((sum, value) => sum + value, 0)
              }
            />
          </div>
          <div className="chart-card  fade-in">
            <div className="chart-controls">
              <h2 className="chart-title">Production v. Consumption</h2>
              <div className="efficiency-toggle">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showEfficiency}
                    onChange={handleEfficiencyToggle}
                  />
                  <span className="slider round"></span>
                </label>
                <span className="efficiency-toggle-label">
                  Energy Efficiency
                </span>
              </div>
            </div>
            {appState.isLoading.get() ? (
              <Loader
                contextVariables={{
                  LOADER_LOGO:
                    'https://patter-demos-mu.vercel.app/Patter_Logo.png',
                  COMPANY_NAME: 'Loading solar power data...',
                }}
              />
            ) : (
              <div
                className={`chart-wrapper ${showMessage ? 'hidden' : ''} ${
                  isChartReady ? 'fade-in' : ''
                }`}
              >
                {showMessage ? (
                  <div className="message-container">
                    <div className="message-box">
                      <h2 className="h3-semi">Analysis Incomplete</h2>
                      <p className="d1-medium">{message}</p>
                    </div>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    className="chart-canvas"
                    aria-label="Solar Power Production vs Consumption Chart"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </Suspense>
    </div>
  );
});

export default SolarPowerChart;
