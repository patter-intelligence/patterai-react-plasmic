/* eslint-disable no-empty-pattern */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Chart, ChartConfiguration, ChartOptions } from 'chart.js/auto';
import { useSalesforceAction } from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import './ProductionChart.module.css';

const LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

const SolarPowerChart: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [consumption, setConsumption] = useState<number[]>([]);
  const [production, setProduction] = useState<number[]>([]);
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // @ts-ignore
  const { error, executeAction } = useSalesforceAction();

  const recordId = appState.recordId.get();

  const createChart = useCallback(() => {
    if (!canvasRef.current || consumption.length === 0 || production.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(76, 124, 247, 0.6)');
    gradient.addColorStop(0.5, 'rgba(76, 124, 247, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

    const consumptionColors = consumption.map((consumptionValue, index) => {
      return consumptionValue > production[index]
        ? 'rgba(255, 99, 132, 0.8)'
        : 'rgba(75, 192, 192, 0.8)';
    });

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: "'Montserrat', sans-serif",
              weight: '600',
            }as any,
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'kWh',
            font: {
              family: "'Montserrat', sans-serif",
              weight: '600',
              size: 14,
            }as any,
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            font: {
              family: "'Montserrat', sans-serif",
              weight: '500',
            }as any,
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
            padding: 15,
            font: {
              family: "'Montserrat', sans-serif",
              weight: '600',
              size: 12,
            }as any,
          },
        },
        title: {
          display: true,
          text: 'Solar Power Production vs Consumption',
          align: 'start',
          font: {
            family: "'Montserrat', sans-serif",
            size: 18,
            weight: '700',
          } as any,
          padding: {
            top: 10,
            bottom: 30,
          },
          color: '#023b95',
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#333',
          titleFont: {
            family: "'Montserrat', sans-serif",
            weight: '600',
            size: 14,
          }as any,
          bodyColor: '#666',
          bodyFont: {
            family: "'Montserrat', sans-serif",
            weight: '500',
            size: 12,
          }as any,
          borderColor: '#ddd',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                const value = context.parsed.y.toFixed(2);
                const difference = context.dataset.type === 'bar'
                  ? (production[context.dataIndex] - context.parsed.y).toFixed(2)
                  : (context.parsed.y - consumption[context.dataIndex]).toFixed(2);
                const trend = getTrend(context.dataIndex, context.dataset.type === 'bar' ? consumption : production);
                
                if (window.innerWidth < 768) {
                  label += `${value} kWh`;
                } else {
                  label += `${value} kWh (${difference} kWh diff, ${trend})`;
                }
              }
              return label;
            }
          }
        },
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuart',
      },
    };

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: LABELS,
        datasets: [
          {
            type: 'bar',
            label: 'Consumption',
            data: consumption,
            backgroundColor: consumptionColors,
            borderColor: consumptionColors.map(color => color.replace('0.8', '1')),
            borderWidth: 2,
            borderRadius: 8,
            order: 2
          },
          {
            type: 'line',
            label: 'Production',
            data: production,
            borderColor: 'rgba(23, 58, 144, 1)',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: 'rgba(23, 58, 144, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: 'rgba(23, 58, 144, 1)',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
            hitRadius: 15,
            order: 1
          } as any
        ]
      },
      options: options,
    };

    chartRef.current = new Chart(ctx, config);
  }, [consumption, production]);

  const getTrend = (index: number, data: number[]) => {
    if (index === 0) return 'N/A';
    const diff = data[index] - data[index - 1];
    const percentage = ((diff / data[index - 1]) * 100).toFixed(1);
    return diff > 0 ? `↑${percentage}%` : `↓${Math.abs(Number(percentage))}%`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (error) {
        setMessage('Error loading data. Please try again later.');
        setShowMessage(true);
        setIsLoading(false);
        return;
      }

      try {
        const chartData = await executeAction('ProductionService.getPresentationChartData', { salesOpportunityId: recordId });

        if (chartData) {
          if (chartData.Analysis_Fetched__c) {
            const consumptionData = chartData.consumption.map((value: string | number) => Number(value));
            const productionData = chartData.production.map((value: string | number) => Number(value));

            if (consumptionData.some(isNaN) || productionData.some(isNaN)) {
              throw new Error('Invalid data received');
            }

            setConsumption(consumptionData);
            setProduction(productionData);
          } else {
            setMessage("Please visit the Energy Consumption tab to complete the analysis and ensure to tap the Run button.");
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
        setIsLoading(false);
      }
    };

    fetchData();
  }, [recordId, error, executeAction]);

  useEffect(() => {
    if (consumption.length > 0 && production.length > 0) {
      createChart();
    }
  }, [consumption, production, createChart]);

  return (
    <div className="chart-container">
      <h1 className="h1-semi">Your Solar Power</h1>
      <div className={`chart-wrapper ${isLoading || showMessage ? 'hidden' : ''}`}>
        <div className={`loader-container ${isLoading ? '' : 'hidden'}`}>
          <div className="loader" />
        </div>
        {showMessage && (
          <div className="message-container">
            <div className="message-box">
              <h2 className="h3-semi">Analysis Incomplete</h2>
              <p className="d1-medium">{message}</p>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="chart-canvas" aria-label="Solar Power Production vs Consumption Chart" />
      </div>
    </div>
  );
};

export default SolarPowerChart;
