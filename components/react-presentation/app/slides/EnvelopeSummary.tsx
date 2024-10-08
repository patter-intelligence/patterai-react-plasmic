import React, { useEffect, useState } from 'react';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import { observer } from '@legendapp/state/react';
// import './EnvelopeSummary.module.css'; // Remove this line as we're not using the module CSS anymore

interface Recipient {
  Id: string;
  Order__c: string;
  Role__c: string;
  First_Name__c: string;
  Last_Name__c: string;
  Email__c: string;
  Status__c: string;
}

interface Document {
  Id: string;
  Name: string;
}

interface Quote {
  Recipients__r: Recipient[];
  Documents__r: Document[];
  Sales_Opportunity__r: {
    Envelope_Id__c: string | null;
  };
}

const ViewIcon = () => {
  return (
    <svg
      className="slide-icon"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 4.5c-2.9 0-5.5 1.7-7.5 3.7-.3.3-.5.7-.5 1.1 0 .4.2.8.5 1.1 2 2 4.6 3.7 7.5 3.7s5.5-1.7 7.5-3.7c.3-.3.5-.7.5-1.1 0-.4-.2-.8-.5-1.1-2-2-4.6-3.7-7.5-3.7zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"
        fill="#696969"
      ></path>
      <path
        d="M10 7.5c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z"
        fill="#696969"
      ></path>
    </svg>
  );
};

const SIGNING_ORDERS = Array.from({ length: 10 }, (_, i) => i + 1);

const EnvelopeSummary: React.FC = observer(() => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const recordId = appState.recordId.get();

  const { refetch: getActiveQuote } = useDirectSalesforceAction<Quote>(
    'QuoteService.getActiveQuoteBySID',
    { salesOpportunityId: recordId }
  );

  const { refetch: setRecipients } = useDirectSalesforceAction(
    'RecipientService.setRecipients',
    {}
  );

  const { refetch: sendEnvelope } = useDirectSalesforceAction(
    'DocusignService.sendEnvelope',
    {}
  );

  const { refetch: setEnvelopeIdSO } = useDirectSalesforceAction(
    'DocusignService.setEnvelopeIdSO',
    {}
  );

  useEffect(() => {
    loadQuote();
  }, [recordId]);

  const loadQuote = async () => {
    try {
      const result = (await getActiveQuote()) as any;
      console.log('getActiveQuote', { result });
      // map Recipients__r.records and Documents__r.records to Recipients and Documents
      result.Recipients__r = result.Recipients__r.records.map((k: any)=>({...k, attributes: undefined}));
      result.Documents__r = result.Documents__r.records.map((k: any)=>({...k, attributes: undefined}));


      setQuote(result);
    } catch (error) {
      console.error('EnvelopeSummary::loadQuote error >> ', error);
    }
  };

  const handleRecipientChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    recipientId: string
  ) => {
    if (!quote) return;

    const updatedRecipients = quote.Recipients__r.map((r) =>
      r.Id === recipientId ? { ...r, [e.target.name]: e.target.value } : r
    );

    

    setQuote({ ...quote, Recipients__r: updatedRecipients });
  };

  const handleSendEnvelope = async () => {
    setInitializing(true);
    try {
      setMessage('Setting Recipients...');
      setProgress(0);
      await setRecipients({ recipients: quote?.Recipients__r, salesOpportunityId: recordId });

      setMessage('Sending Envelope...');
      setProgress(1 / 3);
      const sEnvelope = await sendEnvelope({ salesOpportunityId: recordId });

      setMessage('Setting Envelope Id...');
      setProgress(2 / 3);
      await setEnvelopeIdSO({
        salesOpportunityId: recordId,
        envelopeId: sEnvelope.envelopeId,
      });

      setMessage('Finished...');
      setProgress(1);

      setTimeout(() => setInitializing(false), 100);
      await loadQuote();
    } catch (error) {
      console.error('EnvelopeSummary::handleSendEnvelope error >> ', error);
      setInitializing(false);
    }
  };

  return (
    <div className="es-envelope-summary">
      {/* <div className="envelope-summary__section">
         <h1>Envelope Summary</h1>
        <div className="envelope-summary__grid">
          <div className="envelope-summary__column">
            <h2>Primary</h2>
            <div className="envelope-summary__form">
              <input
                type="text"
                placeholder="First Name"
                value="Dalton"
                readOnly
              />
              <input
                type="text"
                placeholder="Last Name"
                value="Wilt"
                readOnly
              />
              <input
                type="email"
                placeholder="Email"
                value="dwilt@gmail.com"
                readOnly
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value="304-788-9207"
                readOnly
              />
            </div>
          </div>
          <div className="envelope-summary__column">
            <h2>CoSigner</h2>
            <div className="envelope-summary__form">
              <input
                type="text"
                placeholder="First Name"
                value="Breanna"
                readOnly
              />
              <input
                type="text"
                placeholder="Last Name"
                value="Wilt"
                readOnly
              />
              <input
                type="email"
                placeholder="Email"
                value="bwilt@gmail.com"
                readOnly
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value="304-788-9207"
                readOnly
              />
            </div>
          </div>
          <div className="envelope-summary__column">
            <h2>Site</h2>
            <div className="envelope-summary__form">
              <input
                type="text"
                placeholder="Street Address"
                value="32 Kesecker Ln"
                readOnly
              />
              <input type="text" placeholder="City" value="Keyser" readOnly />
              <div className="envelope-summary__form-row">
                <input type="text" placeholder="State" value="WV" readOnly />
                <input type="text" placeholder="Zip" value="26726" readOnly />
              </div>
            </div>
          </div>
        </div> 
      </div> */}

      <div className="es-envelope-summary__section">
        <h1>Documents</h1>
        <div className="es-envelope-summary__documents">
          {quote?.Documents__r &&
            quote?.Documents__r?.map((d) => (
              <div key={d.Id} className="es-envelope-summary__document">
                <span className="es-envelope-summary__document-icon">📄</span>
                <span className="es-envelope-summary__document-name">
                  {d.Name}
                </span>
                <span className="es-envelope-summary__document-preview">
                  <ViewIcon />
                </span>
              </div>
            ))}
        </div>
      </div>

      <div className="es-envelope-summary__section">
        <h1>Signers</h1>
        <div className="es-envelope-summary__signers">
          {quote?.Recipients__r?.map((r) => (
            <div key={r.Id} className="es-envelope-summary__signer">
              <div className="es-envelope-summary__signer-info">
                <div className="es-envelope-summary__signer-avatar">
                  {r.First_Name__c?.[0]}
                  {r.Last_Name__c?.[0]}
                </div>
                <div className="es-envelope-summary__signer-details">
                  <span className="es-envelope-summary__signer-name">
                    {r.First_Name__c} {r.Last_Name__c}
                  </span>
                  <span className="es-envelope-summary__signer-email">
                    {r.Email__c}
                  </span>
                </div>
              </div>
              <div className="es-envelope-summary__signer-controls">
                <div className="es-envelope-summary__select-wrapper">
                  <label htmlFor={`order-${r.Id}`}>Order</label>
                  <select
                    id={`order-${r.Id}`}
                    name="Order__c"
                    value={r.Order__c}
                    onChange={(e) => handleRecipientChange(e, r.Id)}
                    disabled
                  >
                    {SIGNING_ORDERS?.map((_r, index) => (
                      <option key={index} value={String(index + 1)}
                        selected={r.Order__c === String(index + 1)
                      }>
                        {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="es-envelope-summary__select-wrapper">
                  <label htmlFor={`role-${r.Id}`}>Role</label>
                  <select
                    id={`role-${r.Id}`}
                    name="Role__c"
                    value={r.Role__c}
                    onChange={(e) => handleRecipientChange(e, r.Id)}
                    disabled
                  >
                    <option value="Primary">Primary</option>
                    <option value="CoSigner">CoSigner</option>
                    <option value="Manager">Manager</option>
                    <option value="Sales Rep">Sales Rep</option>
                    <option value="Secondary">Secondary</option>
                  </select>
                </div>
              </div>
              <div
                className={`es-envelope-summary__signer-status ${r?.Status__c?.toLowerCase()}`}
              >
                {r.Status__c}
              </div>
            </div>
          ))}
        </div>
        <button
          className="es-envelope-summary__send-button"
          onClick={handleSendEnvelope}
        >
          Send Envelope
        </button>
      </div>

      {initializing && (
        <div className="es-envelope-summary__popup">
          <div className="es-envelope-summary__progress">
            <p>{message}</p>
            <progress value={progress} max="1" />
          </div>
        </div>
      )}
    </div>
  );
});

export default EnvelopeSummary;
