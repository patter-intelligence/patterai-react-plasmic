import React, { useState, useEffect, Suspense } from 'react';
import { observer } from '@legendapp/state/react';
import { appState } from '../state/appState';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import Loader from '../components/Loader';
// No need to import CSS module as we're using global styles now

interface LoanOption {
  loanProviderName: string;
  loanProductId: string;
  term: number;
  monthlyPaymentWithoutUtilityBill: string;
  apr: string;
}

interface GroupedLoanOption {
  providerName: string;
  options: FormattedLoanOption[];
  logoUrl: string;
}

interface FormattedLoanOption extends LoanOption {
  formattedMonthlyPayment: string;
  formattedAPR: string;
}

const LoanOptionsContent: React.FC = observer(() => {
  const [groupedLoanOptions, setGroupedLoanOptions] = useState<GroupedLoanOption[]>([]);
  const [selectedMonthlyPayment, setSelectedMonthlyPayment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const recordId = appState.recordId.get();

  const { refetch: getMonthlyPayments } = useDirectSalesforceAction<LoanOption[]>(
    'LenderService.getMonthlyPaymentsForSalesOpportunityId',
    { salesOpportunityId: recordId }
  );

  useEffect(() => {
    loadMonthlyPayments();
  }, [recordId]);

  const loadMonthlyPayments = async () => {
    try {
      setIsLoading(true);
      const result = await getMonthlyPayments();
      if (result) {
        formatAndGroupLoanOptions(result);
      }
    } catch (error) {
      console.error('Error fetching monthly payments:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAndGroupLoanOptions = (options: LoanOption[]) => {
    const groupedOptions: { [key: string]: FormattedLoanOption[] } = {};
    options.forEach(option => {
      if (!groupedOptions[option.loanProviderName]) {
        groupedOptions[option.loanProviderName] = [];
      }
      groupedOptions[option.loanProviderName].push({
        ...option,
        term: option.term / 12,
        formattedMonthlyPayment: formatCurrency(Number(option.monthlyPaymentWithoutUtilityBill)),
        formattedAPR: formatPercentage(Number(option.apr))
      });
    });

    const formattedGroupedOptions = Object.keys(groupedOptions).map(providerName => ({
      providerName,
      options: groupedOptions[providerName],
      logoUrl: getLogoUrl(providerName)
    }));

    setGroupedLoanOptions(formattedGroupedOptions);
  };

  const formatCurrency = (value: number): string => {
    return value.toFixed(2);
  };

  const formatPercentage = (value: number): string => {
    return value.toFixed(2);
  };

  const getLogoUrl = (providerName: string): string => {
    // Implement logic to return the correct logo URL for each provider
    // For now, return a placeholder
    return 'https://placeholder.com/wp-content/uploads/2018/10/placeholder-1-1.png';
  };

  const handleLoanOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedLoanProductId = event.target.value;
    const selectedOption = groupedLoanOptions
      .flatMap(group => group.options)
      .find(option => option.loanProductId === selectedLoanProductId);
    
    if (selectedOption) {
      setSelectedMonthlyPayment(selectedOption.formattedMonthlyPayment);
      // Dispatch an event with the selected loan option details
      // You can implement this if needed in the React component
    }
  };

  if (isLoading) {
    return (
      <Loader
        contextVariables={{
          LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
          COMPANY_NAME: 'Patter AI',
        }}
      />
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="lod-loan-options-container">
      <div className="lod-card-container">
        <div className="lod-main-card">
          {selectedMonthlyPayment ? (
            <div className="lod-monthly-payment">
              <div className="lod-amount">${selectedMonthlyPayment}/Month</div>
              <div className="lod-program">Solar Savings Program</div>
            </div>
          ) : (
            <div className="lod-monthly-payment">
              <div className="lod-amount">No Option</div>
              <div className="lod-program">Select a Loan Option Below</div>
            </div>
          )}
        </div>

        {groupedLoanOptions.map((group) => (
          <div key={group.providerName} className="lod-provider-card">
            <div className="lod-provider-header">
              {/* TODO: Fix logos */}
              {/* <img src={group.logoUrl} alt={group.providerName} className="lod-provider-logo" /> */}
              <h2>{group.providerName}</h2>
            </div>
            <table className="lod-custom-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Monthly Payment</th>
                  <th>Term</th>
                  <th>APR</th>
                </tr>
              </thead>
              <tbody>
                {group.options.map((option) => (
                  <tr key={option.loanProductId}>
                    <td>
                      <input
                        type="radio"
                        name="loanOption"
                        value={option.loanProductId}
                        onChange={handleLoanOptionChange}
                      />
                    </td>
                    <td>$ {option.formattedMonthlyPayment}</td>
                    <td>{option.term} YR</td>
                    <td>{option.formattedAPR}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
});

const LoanOptionsDisplay: React.FC = () => (
  <Suspense fallback={<Loader contextVariables={{
    LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
    COMPANY_NAME: 'Patter AI',
  }} />}>
    <LoanOptionsContent />
  </Suspense>
);

export default LoanOptionsDisplay;
