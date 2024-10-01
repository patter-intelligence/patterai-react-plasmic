import React, { useEffect, useState, useMemo, useCallback } from 'react';
import CircularChart from './CircularChart';
import EnergyEfficiencySlide from './EnergyEfficiencySlide';
// import './SolargrafDetails.module.css'; // This import is no longer needed
import {
  useDirectSalesforceAction,
} from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import { observer } from '@legendapp/state/react';
import { ChartData } from 'chart.js';
import {
  calculateAdjustedOffset,
  calculateSolarOffset,
} from '../utils/ProductionEngine';

interface SolargrafDetailsProps {
  onLoadingChange: (isLoading: boolean) => void;
}

const SolargrafDetails: React.FC<SolargrafDetailsProps> = observer(
  ({ onLoadingChange }) => {
    const [activeTab, setActiveTab] = useState('DESIGN');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [roofType, setRoofType] = useState('');
    const [sunshineView, setSunshineView] = useState(false);
    const [solarPercentageState, setSolarPercentageState] = useState(0);
    const [efficiencyPercentageState, setEfficiencyPercentageState] =
      useState(0);
    const [utilityPercentageState, setUtilityPercentageState] = useState(0);
    const [totalPercentage, setTotalPercentage] = useState(100);

    const [consumption, setConsumption] = useState<number[]>([]);
    const [production, setProduction] = useState<number[]>([]);
    const [solarOffset, setSolarOffset] = useState(0);
    const [efficiencyOffset, setEfficiencyOffset] = useState(0);
    const [adjustedOffset, setAdjustedOffset] = useState(0);
    const [isChartReady, setIsChartReady] = useState(false);
    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState('');
    const [showEfficiency, setShowEfficiency] = useState(true);
    const [doughnutChartData, setDoughnutChartDataSet] =
      useState<ChartData | null>(null);
    const recordId = appState.recordId.get();
    const totalEnergyEfficiencyOffsetKWh =
      appState.totalEnergyEfficiencyOffsetKWh.get();
    const totalEnergyEfficiencyOffset =
      appState.totalEnergyEfficiencyOffset.get();
    const annualProduction = appState.annualProduction.get();
    const annualConsumption = appState.annualConsumption.get();

    const solarPercentage = useMemo(() => {
      if (annualConsumption && annualConsumption > 0) {
        return Math.round((annualProduction / annualConsumption) * 100);
      }
      return 0;
    }, [annualProduction, annualConsumption]);

    const offsetPercentage = useMemo(() => {
      if (annualConsumption && annualConsumption > 0) {
        const totalOffset = annualProduction + totalEnergyEfficiencyOffsetKWh;
        return Math.round((totalOffset / annualConsumption) * 100);
      }
      return 0;
    }, [annualProduction, annualConsumption, totalEnergyEfficiencyOffsetKWh]);

    const updateCharts = useCallback(() => {
      // Chart update logic is now handled by reactive state
      console.log('Charts updated with new data', {
        totalEnergyEfficiencyOffset,
        totalEnergyEfficiencyOffsetKWh,
        annualProduction,
        annualConsumption,
        solarPercentage,
        offsetPercentage,
      });
    }, [
      totalEnergyEfficiencyOffset,
      totalEnergyEfficiencyOffsetKWh,
      annualProduction,
      annualConsumption,
      solarPercentage,
      offsetPercentage,
    ]);
    const { refetch: getProducts } = useDirectSalesforceAction(
      'SolargrafDetailsController.getProducts',
      { salesOpportunityId: recordId }
    );

    // ConsumptionService.getConsumptionBySalesOpportunityId
    const { refetch: getConsumptionBySalesOpportunityId } =
      useDirectSalesforceAction(
        'ConsumptionService.getConsumptionBySalesOpportunityId',
        { salesOpportunityId: recordId }
      );

    // getDesignBySalesOpportunityId

    const { refetch: getDesignBySalesOpportunityId } =
      useDirectSalesforceAction('DesignService.getDesignBySalesOpportunityId', {
        salesOpportunityId: recordId,
      });

    const { refetch: getActiveQuoteBySID } = useDirectSalesforceAction(
      'QuoteService.getActiveQuoteBySID',
      { salesOpportunityId: recordId }
    );

    const { refetch: fetchChartData } = useDirectSalesforceAction(
      'ProductionService.getPresentationChartData',
      { salesOpportunityId: recordId },
      false
    );

    const design = appState.design.get();
    const panelOptions = appState.panelOptions.get();
    const systemSize = appState.systemSize.get();
    const numberOfModules = appState.numberOfModules.get();

    const dailyProduction = useMemo(() => {
      return annualProduction
        ? Math.round((annualProduction / 365) * 100) / 100
        : 0;
    }, [annualProduction]);

    const averageDailyConsumption = useMemo(() => {
      return annualConsumption
        ? Math.round((annualConsumption / 365) * 100) / 100
        : 0;
    }, [annualConsumption]);

    useEffect(() => {
      const loadData = async () => {
        appState.isLoading.set(true);
        onLoadingChange(true);
        try {
          const [products, consumption, design, quoteService] =
            await Promise.all([
              getProducts({ salesOpportunityId: recordId }),
              getConsumptionBySalesOpportunityId({
                salesOpportunityId: recordId,
              }),
              getDesignBySalesOpportunityId({ salesOpportunityId: recordId }),
              getActiveQuoteBySID({ sid: recordId }),
            ]);

          console.log('products:', products);

          const options = products.map((p: any) => ({
            label: p.Name,
            value: p.Id,
          }));

          appState.panelOptions.set(options);

          const totalEnergyEfficiencyOffset =
            quoteService.Total_Efficiency_Offset__c || 0;
          const annualConsumption = consumption.Post_Total_kWh__c || 0;
          const totalEnergyEfficiencyOffsetKWh =
            (totalEnergyEfficiencyOffset / 100) * annualConsumption;
          const annualProduction = design.Annual_Production_kWh__c || 0;

          console.log('solargrafCharts::getConsumptionBySalesOpportunityId', {
            totalEnergyEfficiencyOffset,
            totalEnergyEfficiencyOffsetKWh,
            annualProduction,
            annualConsumption,
          });

          appState.totalEnergyEfficiencyOffsetKWh.set(
            totalEnergyEfficiencyOffsetKWh
          );
          appState.totalEnergyEfficiencyOffset.set(totalEnergyEfficiencyOffset);
          appState.annualProduction.set(annualProduction);
          appState.annualConsumption.set(annualConsumption);

          // Calculate percentages
          const solarPercentage = Math.round(
            (annualProduction / annualConsumption) * 100
          );
          const efficiencyPercentage = totalEnergyEfficiencyOffset;
          const utilityPercentage = Math.max(
            0,
            100 - solarPercentage - efficiencyPercentage
          );
          const totalPercentage =
            solarPercentage + efficiencyPercentage + utilityPercentage;

          setSolarPercentageState(solarPercentage);
          setEfficiencyPercentageState(efficiencyPercentage);
          setUtilityPercentageState(utilityPercentage);
          setTotalPercentage(totalPercentage);

          // Update charts with new data
          updateCharts();
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          appState.isLoading.set(false);
          onLoadingChange(false);
        }
      };

      loadData();
    }, [recordId]);

    useEffect(() => {
      const fetchData = async () => {
        try {
          appState.isLoading.set(true);
          const chartData = (await fetchChartData()) as any;

          console.log('Production Chart Data: ', chartData);

          if (chartData) {
            setDoughnutChartDataSet(chartData);
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
              // setMessage(
              //   'Please visit the Energy Consumption tab to complete the analysis and ensure to tap the Run button.'
              // );
              // setShowMessage(true);
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

    useEffect(() => {
      if (doughnutChartData) {
        const calculatedSolarOffset = calculateSolarOffset(
          [annualProduction],
          consumption
        );
        setSolarOffset(calculatedSolarOffset);

        const efficiencyOffsetValue =
          (doughnutChartData as any)?.totalEnergyEfficiencyOffset || 0;
        setEfficiencyOffset(showEfficiency ? efficiencyOffsetValue : 0);

        const adjustedOffsetValue = calculateAdjustedOffset(
          [annualProduction],
          consumption,
          efficiencyOffsetValue
        );
        setAdjustedOffset(
          showEfficiency ? adjustedOffsetValue : calculatedSolarOffset
        );
      }
    }, [
      production,
      annualProduction,
      consumption,
      showEfficiency,
      doughnutChartData,
    ]);

    if (appState.isLoading.get()) {
      return (
        <div className="sd-solargraf-details sd-loading">
          <div className="sd-loading-spinner"></div>
          <p>Loading solar system details...</p>
        </div>
      );
    }

    const panelName =
      panelOptions.find((p: { value: any }) => p.value === design?.Product__c)
        ?.label || '';

    return (
      <div className="sd-solargraf-details">
        <div className="sd-tabs">
          <div
            className={`sd-tab ${activeTab === 'PLACEMENT' ? 'sd-active' : ''}`}
            onClick={() => setActiveTab('PLACEMENT')}
          >
            PLACEMENT
          </div>
          <div
            className={`sd-tab ${activeTab === 'DESIGN' ? 'sd-active' : ''}`}
            onClick={() => setActiveTab('DESIGN')}
          >
            DESIGN
          </div>
          <div
            className={`sd-tab ${activeTab === 'EFFICIENCY' ? 'sd-active' : ''}`}
            onClick={() => setActiveTab('EFFICIENCY')}
          >
            EFFICIENCY
          </div>
        </div>
        {activeTab === 'PLACEMENT' && (
          <div className="sd-design-content">
            {/* <div className="design-header">
              <h2 className="design-title">Roof Placement</h2>
            </div> */}
            <div className="sd-design-cards">
              <div className="sd-design-card">
                <div className="sd-card-title">Roof Type</div>
                <select
                  className="sd-card-value"
                  value={roofType}
                  onChange={(e) => setRoofType(e.target.value)}
                >
                  <option value="">Select Roof Type</option>
                  <option value="shingle">Shingle</option>
                  <option value="tile">Tile</option>
                  <option value="metal">Metal</option>
                </select>
              </div>
              <div className="sd-design-card">
                <div className="sd-card-title">Sunshine View</div>
                <label className="sd-switch">
                  <input
                    type="checkbox"
                    checked={sunshineView}
                    onChange={() => setSunshineView(!sunshineView)}
                  />
                  <span className="sd-slider sd-round"></span>
                </label>
              </div>
            </div>
            <button
              className="sd-navigation-button"
              onClick={() => setActiveTab('DESIGN')}
            >
              DESIGN
            </button>
          </div>
        )}
        {activeTab === 'DESIGN' && (
          <div className="sd-design-content">
            {/* <div className="design-header">
              <h2 className="design-title">Design Your System</h2>
              {/* <button className="collapse-button" onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
              </button> /}
            </div> */}
            {!isCollapsed && (
              <>
                <div className="sd-efficiency-container">
                  <div className="sd-design-chart-old">
                    <CircularChart
                     className="sd-circular-chart-card"
                      size={150}
                      solarPercentage={solarOffset}
                      efficiencyPercentage={0}
                      utilityPercentage={100 - solarOffset - 0}
                      solarKWh={production.reduce(
                        (sum, value) => sum + value,
                        0
                      )}
                      utilityKWh={
                        consumption.reduce((sum, value) => sum + value, 0) -
                        production.reduce((sum, value) => sum + value, 0)
                      }
                      showEfficiency={true}
                    />
                    {/* <div className="chart-percentage">{offsetPercentage}%</div> */}
                  </div>
                  {/* <div className="chart-legend">
                    <div className="legend-item">
                      <span
                        className="legend-color"
                        style={{ backgroundColor: '#ffa500' }}
                      ></span>
                      <span>Solar ({solarPercentage}%)</span>
                    </div>
                    <div className="legend-item">
                      <span
                        className="legend-color"
                        style={{ backgroundColor: '#4CAF50' }}
                      ></span>
                      <span>
                        Efficiency ({offsetPercentage - solarPercentage}%)
                      </span>
                    </div>
                    <div className="legend-item">
                      <span
                        className="legend-color"
                        style={{ backgroundColor: '#e0e0e0' }}
                      ></span>
                      <span>Utility ({100 - offsetPercentage}%)</span>
                    </div>
                  </div> */}
                </div>
                <div className="sd-design-cards">
                  <div className="sd-design-card">
                    <div className="sd-card-title">Daily Production</div>
                    <div className="sd-card-value">{dailyProduction} kWh</div>
                  </div>
                  <div className="sd-design-card">
                    <div className="sd-card-title">My Average Daily Usage</div>
                    <div className="sd-card-value">{averageDailyConsumption} kWh</div>
                  </div>
                  <div className="sd-design-card">
                    <div className="sd-card-title">System Size</div>
                    <div className="sd-card-value">
                      {appState.systemSize.get().toFixed(2)} kW
                    </div>
                  </div>
                  <div className="sd-design-card">
                    <div className="sd-card-title">Modules</div>
                    <div className="sd-card-value">{numberOfModules}</div>
                  </div>
                </div>
                <div className="sd-design-card">
                  <div className="sd-card-title">Panel Type</div>
                  <select
                    className="sd-card-value"
                    value={design?.Product__c}
                    onChange={(e) => console.log(e.target.value)}
                  >
                    <option value="">Select Panel Type</option>
                    {panelOptions.map((option: any) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <button
              className="sd-navigation-button"
              onClick={() => setActiveTab('EFFICIENCY')}
            >
              EFFICIENCY
            </button>
          </div>
        )}
        {activeTab === 'EFFICIENCY' && (
          <div className="sd-design-content">
            {/* <div className="design-header">
              <h2 className="design-title">Energy Efficiency</h2>
            </div> */}
            <div className="sd-efficiency-container">
              <div className="sd-design-chart-old">
                <CircularChart
                     className="sd-circular-chart-card"

                  size={150}
                  solarPercentage={solarOffset}
                  efficiencyPercentage={efficiencyOffset}
                  utilityPercentage={100 - solarOffset - efficiencyOffset}
                  solarKWh={production.reduce((sum, value) => sum + value, 0)}
                  utilityKWh={
                    consumption.reduce((sum, value) => sum + value, 0) -
                    production.reduce((sum, value) => sum + value, 0)
                  }
                />
              </div>
              {/* <div className="chart-legend">
                <div className="legend-item">
                  <span
                    className="legend-color"
                    style={{ backgroundColor: '#FFA500' }}
                  ></span>
                  <span>Solar ({solarPercentage}%)</span>
                </div>
                {energyEfficiency && (
                  <div className="legend-item">
                    <span
                      className="legend-color"
                      style={{ backgroundColor: '#4CAF50' }}
                    ></span>
                    <span>Efficiency ({efficiencyPercentageState}%)</span>
                  </div>
                )}
                <div className="legend-item">
                  <span
                    className="legend-color"
                    style={{ backgroundColor: '#CCCCCC' }}
                  ></span>
                  <span>Utility ({utilityPercentageState + (energyEfficiency ? 0 : efficiencyPercentageState)}%)</span>
                </div>
              </div> */}
            </div>
            <EnergyEfficiencySlide
              showEfficiency={showEfficiency}
              isExpanded={showEfficiency}
              onToggle={(newValue) => {
                setShowEfficiency(newValue);
                // Update other state or trigger recalculations here
                if (newValue) {
                  setAdjustedOffset(calculateAdjustedOffset(production, consumption, efficiencyOffset));
                } else {
                  setAdjustedOffset(solarOffset);
                }
              }}
            />
            <button
              className="sd-navigation-button"
              onClick={() => setActiveTab('PLACEMENT')}
            >
              PLACEMENT
            </button>
          </div>
        )}
      </div>
    );
  }
);

export default SolargrafDetails;
