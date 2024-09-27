/* eslint-disable @typescript-eslint/no-explicit-any */
import { updateCurrentSlideUrl } from '../utilities/navigationUtils';
declare global {
  interface Window {
    __salesforce__: any;
  }
}

interface QueryParams {
  objectName: string;
  fields: string[];
  where?: string;
  orderBy?: string;
  limit?: number;
}

interface UpsertParams {
  objectName: string;
  records: Record<string, any>[];
}

const devServerUrl = ' http://localhost:3339';

class SalesforceRepository {
  private isClientSide: boolean;

  constructor() {
    // also check if we are in an iframe
    this.isClientSide =
      typeof window !== 'undefined' &&
      window.__salesforce__ !== undefined &&
      window.parent !== window;
  }

  async query(
    params: QueryParams
  ): Promise<{ records: any[]; totalSize: number; done: boolean }> {
    if (this.isClientSide) {
      return window.__salesforce__.query(params);
    } else {
      // Call backend API
      const response = await fetch(devServerUrl + '/api/salesforce/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      return {
        records: result.records,
        totalSize: result.totalSize,
        done: result.done,
      };
    }
  }

  async upsert(params: UpsertParams): Promise<any> {
    if (this.isClientSide) {
      return window.__salesforce__.upsert(params);
    } else {
      // Call backend API
      const response = await fetch(devServerUrl + '/api/salesforce/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return response.json();
    }
  }

  async callApexMethod(
    methodName: string,
    params: Record<string, any>
  ): Promise<any> {
    console.log(`Calling Apex method: ${methodName}`, params);
    if (this.isClientSide) {
      return window.__salesforce__.callApexMethod(methodName, params);
    } else {
      // Call backend API
      const requestBody = {
        methodName,
        params,
      };
      console.log('Sending request to backend:', requestBody);
      const response = await fetch(devServerUrl + '/api/salesforce/apex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();
      console.log('Received response from backend:', result);
      if (result.error) {
        throw new Error(`Apex method call failed: ${result.error}`);
      }
      return result;
    }
  }

  async getObjectInfo(params: { objectName: string }): Promise<any> {
    if (this.isClientSide) {
      return window.__salesforce__.getObjectInfo(params);
    } else {
      // Call backend API
      const response = await fetch(
        devServerUrl + '/api/salesforce/objectInfo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.json();
    }
  }

  async updateCurrentSlide(params: { currentSlide: number }): Promise<any> {
    if (this.isClientSide) {
      return window.__salesforce__.updateCurrentSlide(params);
    }
  }

  async getPresentationForSalesOpportunity(
    salesOpportunityId: string
  ): Promise<any> {
    console.log(
      `Getting presentation for sales opportunity: ${salesOpportunityId}`
    );
    try {
      const result = await this.callApexMethod(
        'PresentationService.getPresentationForSalesOpportunity',
        { salesOpportunityId }
      );
      console.log('Presentation data received:', result);
      return result;
    } catch (error) {
      console.error('Error in getPresentationForSalesOpportunity:', error);
      throw error;
    }
  }

  async getPresentationById(presentationId: string, salesOpportunityId: string): Promise<any> {
    return this.callApexMethod('PresentationService.getPresentationById', {
      presentationId,salesOpportunityId
    });
  }
}

export default SalesforceRepository;
