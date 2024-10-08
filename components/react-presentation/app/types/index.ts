export interface ContactItem {
    First_Name__c: string;
    Last_Name__c: string;
    Email__c: string;
    Phone__c: string;
    id: string;
    LastModifiedDate?: string;
    SalesOpportunityId?: string;
  }

  export interface ISalesStore {
    fetchContacts: () => Promise<void>;
    getContacts: () => ContactItem[];
    updateContact: (id: string, data: Partial<ContactItem>) => void;
    addContact: (data: ContactItem) => void;
  }

  export interface Roof {
    Azimuth__c: number;
    Pitch__c: number;
    Area__c: number;
    Name: string;
    Modules__r: Module[];
  }
  
  export interface Module {
    Name: string;
    isEnabled__c: boolean;
    X__c: number;
    Y__c: number;
    Z__c: number;
  }

  export interface PanelOption {
    label: string;
    value: string;
  }

  export interface IEnergyEfficientProduct {
    Name: string;
    Image__c: string;
    ImageLarge__c: string;
    Description__c: string;
    Offset__c: number;
    Custom__c:       {
          benefits: string[];
          potentialSavings: number;
          kWhSavings: number;
        };
    Id: string;
    Quantity: number;
    Qualified: boolean;
    // support for pricing
    product?:any;
    quantity?:number; 
  }

  export interface Section {
    title: string;
    id: string;
    group: string;
    description: string;
    captures: { type: string; minimumPhotos: number }[];
    sanitizedName?:string;
    storedFiles?: any[]; 
    uploadProgress?: number;
    fulfilled?: boolean;
  }