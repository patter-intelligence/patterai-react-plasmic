import React, { useEffect, useState } from 'react';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import './QuoteSummary.module.css';
import { observer } from '@legendapp/state/react';
import { formatNumber } from '../components/ui/utils';

interface Quote {
  Id: string;
  Name: string;
  Consumption__c: string;
  Design__c: string;
  Total_Cost__c: number;
  Utility_Provider__c: string;
  Utility_Tariff__c: string;
  Annual_Production_kWh__c: number;
  System_Size_kW__c: number;
  Module_Type__c: string;
  Panel_Count__c: number;
  January_kWh__c: number;
  February_kWh__c: number;
  March_kWh__c: number;
  April_kWh__c: number;
  May_kWh__c: number;
  June_kWh__c: number;
  July_kWh__c: number;
  August_kWh__c: number;
  September_kWh__c: number;
  October_kWh__c: number;
  November_kWh__c: number;
  December_kWh__c: number;
}

interface Signer {
  Id: string;
  Name: string;
  First_Name__c: string;
  Last_Name__c: string;
  Email__c: string;
  Phone__c: string;
}

interface Site {
  Id: string;
  Address__Street__s: string;
  Address__City__s: string;
  Address__StateCode__s: string;
  Address__PostalCode__s: string;
}

const QuoteSummary: React.FC = observer(() => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [primary, setPrimary] = useState<Signer | null>(null);
  const [cosigner, setCosigner] = useState<Signer | null>(null);
  const [site, setSite] = useState<Site | null>(null);

  const recordId = appState.recordId.get();
  const activeQuoteId = appState.activeQuoteId.get();

  const { executeAction: fetchQuote } = useDirectSalesforceAction<Quote>(
    'QuoteService.getActiveQuoteBySID',
    { salesOpportunityId: recordId },
    false
  );
  const { executeAction: fetchSalesOpportunity } = useDirectSalesforceAction(
    'SalesOpportunityService.getSalesOpportunity',
    { salesOpportunityId: recordId },
    false
  );
  const { executeAction: fetchSigners } = useDirectSalesforceAction<Signer[]>(
    'SignerService.getSignersBySID',
    { salesOpportunityId: recordId },
    false
  );
  const { executeAction: fetchSite } = useDirectSalesforceAction<Site>(
    'SiteService.getSite',
    { id: '' },
    false
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const quoteData = await fetchQuote();
        setQuote(quoteData);

        const salesOpportunity = await fetchSalesOpportunity();
        console.log({ salesOpportunity });
        const signers = await fetchSigners();
        const siteData = await fetchSite({ id: salesOpportunity.Site__c });

        setPrimary(signers.find((s) => s.Name === 'Primary') || null);
        setCosigner(signers.find((s) => s.Name === 'CoSigner') || null);
        setSite(siteData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (recordId) {
      loadData();
    }
  }, [recordId, activeQuoteId]);

  if (!quote) {
    return <div>Loading...</div>;
  }

  return (
    <div className="qs-quote-summary-container">
      <h1>Quote Summary</h1>
      <hr />
      <div className="qs-quote-grid">
        <div className="qs-quote-column">
          <div className="qs-field">
            <label>Consumption</label>
            <span>{quote.Consumption__c}</span>
          </div>
          <div className="field">
            <label>Total Cost</label>
            <span>{quote.Total_Cost__c}</span>
          </div>
          <div className="field">
            <label>Utility Provider</label>
            <span>{quote.Utility_Provider__c}</span>
          </div>
          <div className="field">
            <label>Utility Tariff</label>
            <span>{quote.Utility_Tariff__c}</span>
          </div>
          <div className="qs-monthly-kwh">
            <div className="qs-field">
              <label>January kWh</label>
              <span>{formatNumber(quote.January_kWh__c)}</span>
            </div>
            <div className="field">
              <label>February kWh</label>
              <span>{formatNumber(quote.February_kWh__c)}</span>
            </div>
            <div className="field">
              <label>March kWh</label>
              <span>{formatNumber(quote.March_kWh__c)}</span>
            </div>
            <div className="field">
              <label>April kWh</label>
              <span>{formatNumber(quote.April_kWh__c)}</span>
            </div>
          </div>
        </div>
        <div className="qs-quote-column">
          <div className="qs-field">
            <label>Design</label>
            <span>{quote.Design__c}</span>
          </div>
          <div className="field">
            <label>Annual Production kWh</label>
            <span>{formatNumber(quote.Annual_Production_kWh__c)}</span>
          </div>
          <div className="field">
            <label>System Size kW</label>
            <span>{formatNumber(quote.System_Size_kW__c)}</span>
          </div>
          <div className="qs-monthly-kwh">
            <div className="qs-field">
              <label>May kWh</label>
              <span>{formatNumber(quote.May_kWh__c)}</span>
            </div>
            <div className="field">
              <label>June kWh</label>
              <span>{formatNumber(quote.June_kWh__c)}</span>
            </div>
            <div className="field">
              <label>July kWh</label>
              <span>{formatNumber(quote.July_kWh__c)}</span>
            </div>
            <div className="field">
              <label>August kWh</label>
              <span>{formatNumber(quote.August_kWh__c)}</span>
            </div>
          </div>
        </div>
        <div className="qs-quote-column">
          <div className="qs-field">
            <label>Module Type</label>
            <span>{quote.Module_Type__c}</span>
          </div>
          <div className="field">
            <label>Panel Count</label>
            <span>{quote.Panel_Count__c}</span>
          </div>
          <div className="qs-monthly-kwh">
            <div className="qs-field">
              <label>September kWh</label>
              <span>{formatNumber(quote.September_kWh__c)}</span>
            </div>
            <div className="field">
              <label>October kWh</label>
              <span>{formatNumber(quote.October_kWh__c)}</span>
            </div>
            <div className="field">
              <label>November kWh</label>
              <span>{formatNumber(quote.November_kWh__c)}</span>
            </div>
            <div className="field">
              <label>December kWh</label>
              <span>{formatNumber(quote.December_kWh__c)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="qs-signers-site-grid">
        <div className="qs-signer-box">
          <h2>Primary</h2>
          {primary && (
            <>
              <div className="qs-field">
                <label>First Name</label>
                <span>{primary.First_Name__c}</span>
              </div>
              <div className="field">
                <label>Last Name</label>
                <span>{primary.Last_Name__c}</span>
              </div>
              <div className="field">
                <label>Email</label>
                <span>{primary.Email__c}</span>
              </div>
              <div className="field">
                <label>Phone</label>
                <span>{primary.Phone__c}</span>
              </div>
            </>
          )}
        </div>
        <div className="qs-signer-box">
          <h2>CoSigner</h2>
          {cosigner && (
            <>
              <div className="qs-field">
                <label>First Name</label>
                <span>{cosigner.First_Name__c}</span>
              </div>
              <div className="field">
                <label>Last Name</label>
                <span>{cosigner.Last_Name__c}</span>
              </div>
              <div className="field">
                <label>Email</label>
                <span>{cosigner.Email__c}</span>
              </div>
              <div className="field">
                <label>Phone</label>
                <span>{cosigner.Phone__c}</span>
              </div>
            </>
          )}
        </div>
        <div className="qs-site-box">
          <h2>Site</h2>
          {site && (
            <>
              <div className="qs-field">
                <label>Street</label>
                <span>{site.Address__Street__s}</span>
              </div>
              <div className="field">
                <label>City</label>
                <span>{site.Address__City__s}</span>
              </div>
              <div className="field">
                <label>State</label>
                <span>{site.Address__StateCode__s}</span>
              </div>
              <div className="field">
                <label>Postal Code</label>
                <span>{site.Address__PostalCode__s}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default QuoteSummary;
