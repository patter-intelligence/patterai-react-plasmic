export interface ChartData {
  consumption: number[];
  production: number[];
  totalEnergyEfficiencyOffset: number;
}

export const calculateSolarOffset = (production: number[], consumption: number[]): number => {
  const totalProduction = production.reduce((sum, value) => sum + value, 0);
  const totalConsumption = consumption.reduce((sum, value) => sum + value, 0);
  return Math.round((totalProduction / totalConsumption) * 100);
};

export const calculateAdjustedOffset = (
  production: number[],
  consumption: number[],
  efficiencyOffset: number
): number => {
  const totalProduction = production.reduce((sum, value) => sum + value, 0);
  const totalConsumption = consumption.reduce((sum, value) => sum + value, 0);
  const adjustedConsumption = totalConsumption * (1 - efficiencyOffset / 100);
  return Math.round((totalProduction / adjustedConsumption) * 100);
};

export const adjustConsumption = (consumption: number[], efficiencyOffset: number): number[] => {
  return consumption.map(value => Math.max(0, value - (value * efficiencyOffset / 100)));
};

export const getConsumptionColors = (consumption: number[], production: number[]): string[] => {
  return consumption.map((consumptionValue, index) => 
    consumptionValue > production[index]
      ? 'rgba(200, 200, 200, 0.8)'
      : 'rgba(23, 58, 144, 0.8)'
  );
};

export const getTrend = (index: number, data: number[]): string => {
  if (index === 0) return 'N/A';
  const diff = data[index] - data[index - 1];
  const percentage = ((diff / data[index - 1]) * 100).toFixed(1);
  return diff > 0 ? `↑${percentage}%` : `↓${Math.abs(Number(percentage))}%`;
};
