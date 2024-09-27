/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './SolargrafCharts.module.css';
import { appState } from '../state/appState';
import { observer } from '@legendapp/state/react';

interface SolargrafChartsProps {
  recordId: string;
  onLoadingChange: (isLoading: boolean) => void;
}

const SolargrafCharts: React.FC<SolargrafChartsProps> = observer(({  onLoadingChange }) => {
  const [postTotalKWh, setPostTotalKWh] = useState<number>(0);
  const [annualProduction, setAnnualProduction] = useState<number>(0);
  const [totalEnergyEfficiencyOffsetKWh, setTotalEnergyEfficiencyOffsetKWh] = useState<number>(0);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chart2Ref = useRef<HTMLCanvasElement>(null);
  const barChartInstance = useRef<Chart | null>(null);
  const doughnutChartInstance = useRef<Chart | null>(null);

  const recordId = appState.recordId.get();

  useEffect(() => {
    const loadData = async () => {
      // Simulating API calls
      setPostTotalKWh(10000);
      setAnnualProduction(5000);
      setTotalEnergyEfficiencyOffsetKWh(1000);
    };

    loadData();
  }, [recordId]);

  useEffect(() => {
    if (chartRef.current && chart2Ref.current) {
      const ctx = chartRef.current.getContext('2d');
      const ctx2 = chart2Ref.current.getContext('2d');

      if (ctx && ctx2) {
        // Destroy existing charts if they exist
        if (barChartInstance.current) {
          barChartInstance.current.destroy();
        }
        if (doughnutChartInstance.current) {
          doughnutChartInstance.current.destroy();
        }

        // Create new charts
        barChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Utility', 'Solar', 'Other'],
            datasets: [{
              label: 'Production',
              data: [postTotalKWh - annualProduction - totalEnergyEfficiencyOffsetKWh, annualProduction, totalEnergyEfficiencyOffsetKWh],
              backgroundColor: ['rgba(128,128,128, 0.95)', 'rgba(26,148,49, 0.95)', 'rgba(255,140,0, .95)'],
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });

        doughnutChartInstance.current = new Chart(ctx2, {
          type: 'doughnut',
          data: {
            labels: ['Utility', 'Solar', 'EE'],
            datasets: [{
              data: [postTotalKWh - annualProduction - totalEnergyEfficiencyOffsetKWh, annualProduction, totalEnergyEfficiencyOffsetKWh],
              backgroundColor: ['rgba(128,128,128, 0.95)', 'rgba(26,148,49, 0.95)', 'rgba(255,140,0, .95)'],
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
              },
            }
          }
        } as any);
      }
    }

    return () => {
      // Cleanup function to destroy charts when component unmounts
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
      if (doughnutChartInstance.current) {
        doughnutChartInstance.current.destroy();
      }
    };
  }, [postTotalKWh, annualProduction, totalEnergyEfficiencyOffsetKWh]);

  return (
    <div className="solargraf-charts">
      <div className="chart-container">
        <canvas ref={chart2Ref}></canvas>
      </div>
      <div className="chart-container" style={{ display: 'none' }}>
        <h1>Production Chart</h1>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
});

export default SolargrafCharts;
