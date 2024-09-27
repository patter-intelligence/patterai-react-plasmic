import { observable } from "@legendapp/state";
import { ChartData } from "chart.js";

export interface IProvider {
    label: string;
    value: number;
    selected: boolean;
  }
  
  export interface ITariff {
    label: string;
    value: number;
    selected: boolean;
  }
  
  export interface IAnalysis {
    Id: string;
    Consumption__c: string;
    Display_Label__c: string;
    Series_Id__c: string;
    Series_Period__c: string;
    From_Date_Time__c: string;
    To_Date_Time__c: string;
    Cost__c: number;
    Quantity__c: number;
    Rate__c: number;
  }
  
  export interface IConsumption {
    Id: string;
    Sales_Opportunity__c: string;
    Utility_Provider__c?: string;
    Utility_Tariff__c?: string;
    lseId__c?: string;
    masterTariffId__c?: string;
    Net_Avoided_kWh__c?: number;
    Post_Total_kWh__c?: number;
    averageMonthlyUsage?: number;
    averageMonthlyBill?: number;
    January_kWh__c?: number;
    February_kWh__c?: number;
    March_kWh__c?: number;
    April_kWh__c?: number;
    May_kWh__c?: number;
    June_kWh__c?: number;
    July_kWh__c?: number;
    August_kWh__c?: number;
    September_kWh__c?: number;
    October_kWh__c?: number;
    November_kWh__c?: number;
    December_kWh__c?: number;
    Sales_Opportunity__r?: {
      Analysis_Fetched__c: boolean;
    };
    Analyses__r?: IAnalysis[];
  }
  
  export interface IState {
    step: number;
    isLoading: boolean;
    currentYear: number;
    costValue: string;
    costChange: string;
    consumption: IConsumption | null;
    providers: IProvider[];
    tariffs: ITariff[];
    selectedUtilityProvider: string;
    selectedUtilityTariff: string;
    analysis: IAnalysis[];
    chartData: ChartData<'line'> | null;
    isTariffLoading: boolean;
    loaderTitle?:string;
  }
  
  export const $state = observable({
    step: 1,
    isLoading: true,
    currentYear: 1,
    costValue: '',
    costChange: '',
    consumption: null,
    providers: [],
    tariffs: [],
    selectedUtilityProvider: '',
    selectedUtilityTariff: '',
    analysis: [],
    chartData: null,
    isTariffLoading: false,
  } as IState);