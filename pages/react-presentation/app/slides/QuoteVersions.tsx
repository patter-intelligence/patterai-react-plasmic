import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  useDirectSalesforceAction,
} from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import './QuoteVersions.module.css';
import { observer } from '@legendapp/state/react';
import { toast } from 'react-toastify';

interface Quote {
  Id: string;
  Name: string;
  isActive__c: boolean;
  Consumption__r: { Name: string };
  Design__r: { Name: string };
  Sales_Opportunity__r: { Name: string };
  Module_Type__c: string;
}

const QuoteVersions: React.FC = observer(() => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingQuotes, setActivatingQuotes] = useState<{ [key: string]: boolean }>({});
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordId = appState.recordId.get();
  const quoteGridRef = useRef<HTMLDivElement>(null);

  const fakeQuote: Quote = {
    Id: 'generating',
    Name: 'New Quote',
    isActive__c: false,
    Consumption__r: { Name: 'Generating...' },
    Design__r: { Name: 'Generating...' },
    Sales_Opportunity__r: { Name: 'Generating...' },
    Module_Type__c: 'Generating...',
  };

  const {
    executeAction: fetchQuotes,
  } = useDirectSalesforceAction<Quote[]>('QuoteService.getQuotesBySID', {
    salesOpportunityId: recordId,
  }, false);

  const {
    executeAction: activateQuote,
  } = useDirectSalesforceAction<string>('QuoteService.activateQuote', {
    salesOpportunityId: recordId,
    quoteId: '',
  }, false);

  const {
    executeAction: generateQuote
  } = useDirectSalesforceAction<string>('QuoteService.generateQuote', {
    salesOpportunityId: recordId,
  }, false);

  const loadQuotes = useCallback(async () => {
    if (recordId) {
      try {
        setLoading(true);
        const quotesData = await fetchQuotes({ salesOpportunityId: recordId });
        setQuotes(quotesData);
      } catch (err) {
        setError('Error fetching quotes');
        console.error('Error fetching quotes:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [recordId, fetchQuotes]);

  useEffect(() => {
    loadQuotes();
  }, [recordId]);

  const handleActivate = async (quoteId: string) => {
    try {
      setActivatingQuotes(prev => ({ ...prev, [quoteId]: true }));
      await activateQuote({ salesOpportunityId: recordId, quoteId: quoteId });
      appState.activeQuoteId.set(quoteId);
      setQuotes(prevQuotes => 
        prevQuotes.map(quote => ({
          ...quote,
          isActive__c: quote.Id === quoteId
        }))
      );
      // You might want to implement a message passing mechanism here
      // sendMessage({
      //   recordId: recordId,
      //   message: 'quoteChanged',
      //   activeQuoteId: quoteId
      // });
    } catch (error) {
      console.error('Error activating quote:', error);
      setError('Error activating quote');
    } finally {
      setActivatingQuotes(prev => ({ ...prev, [quoteId]: false }));
    }
  };

  const scrollToGeneratingQuote = useCallback(() => {
    setTimeout(() => {
      const generatingQuote = document.querySelector('.quote-box.generating');
      if (generatingQuote) {
        generatingQuote.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  const handleGenerateQuote = async () => {
    try {
      setGeneratingQuote(true);
      setQuotes(prevQuotes => [fakeQuote, ...prevQuotes]);
      scrollToGeneratingQuote();
      
      // Simulate quote generation delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await generateQuote();
      await loadQuotes();
      
      toast.success('Quote generated successfully!');
    } catch (error) {
      console.error('Error generating quote:', error);
      setError('Error generating quote');
      toast.error('Failed to generate quote. Please try again.');
    } finally {
      setGeneratingQuote(false);
    }
  };

  const scrollToActiveQuote = useCallback(() => {
    setTimeout(() => {
      const activeQuote = document.querySelector('.quote-box.active');
      if (activeQuote) {
        activeQuote.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }, []);

  useEffect(() => {
    if (!loading) {
      scrollToActiveQuote();
    }
  }, [quotes, loading, scrollToActiveQuote]);

  return (
    <div className="quote-versions-container">
      <div className="quote-versions-header">
        <div className="generate-quote-button">
          <button onClick={handleGenerateQuote} disabled={loading}>
            Generate Quote
          </button>
        </div>
      </div>
      <div className="quotes-scroll-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quote versions...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>Error: {error}</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="no-quotes-container">
            <p>No quote versions available. Generate a new quote to get started.</p>
          </div>
        ) : (
          <div className="quotes-grid" ref={quoteGridRef}>
            {quotes.map((quote) => (
              <div
                key={quote.Id}
                className={`quote-box ${quote.isActive__c ? 'active' : ''} ${activatingQuotes[quote.Id] ? 'activating' : ''} ${quote.Id === 'generating' ? 'generating' : ''}`}
                onClick={() => {
                  if (!activatingQuotes[quote.Id] && quote.Id !== 'generating') {
                    handleActivate(quote.Id);
                  }
                }}
              >
              <h1>
                <b>{quote.Name}</b>
                {quote.isActive__c && <span className="active-label">Active</span>}
              </h1>
              <hr />
              <p>
                <b>Consumption</b>: {quote.Consumption__r.Name}
              </p>
              <p>
                <b>Sales Opportunity</b>: {quote.Sales_Opportunity__r.Name}
              </p>
              <br />
              <p>
                <b>Module Type</b>: {quote.Module_Type__c}
              </p>
              {activatingQuotes[quote.Id] && (
                <div className="quote-activating-overlay">
                  <div className="loading-spinner"></div>
                  <p>Activating...</p>
                </div>
              )}
              {quote.Id === 'generating' && <GeneratingQuoteOverlay />}
            </div>
          ))}
        </div>
      )}
    </div>
</div>
  );
});

const GeneratingQuoteOverlay: React.FC = () => (
  <div className="quote-generating-overlay">
    <div className="loading-spinner"></div>
    <p>Generating new quote...</p>
  </div>
);

export default QuoteVersions;
